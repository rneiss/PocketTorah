import { AVPlaybackSource, AVPlaybackStatusSuccess, AVPlaybackStatusToSet, Audio } from "expo-av";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExteriorPromise, exteriorPromise } from "./utils";

export interface Audio {
  loaded: boolean;
  currentTrack: number;
  currentTime: number;
  setCurrentTime: (track: number, time: number) => void;
  playing: boolean;
  play: () => void;
  pause: () => void;
  speed: number;
  setSpeed: (speed: number) => void;
}

type AudioMethods = {
  [k in keyof Audio as Audio[k] extends Function ? k : never]: Audio[k];
};

type SetStatusAsync = (
  status:
    | { positionMillis: number; track: number; shouldPlay: true }
    | { nextTrack: true }
    | { rate: number }
    | { shouldPlay: boolean },
) => Promise<void>;

type Status = Pick<AVPlaybackStatusSuccess, "positionMillis" | "isPlaying" | "rate"> & {
  isLoaded: boolean;
};

const defaultStatus = {
  positionMillis: 0,
  isPlaying: false,
  rate: 1,
  isLoaded: false,
};

type UseAudioProps = { speed?: number };
export function useAudio<T extends AVPlaybackSource[] | null>(
  title: T,
  props?: UseAudioProps,
): T extends AVPlaybackSource[] ? Audio : null;
export function useAudio(
  title: AVPlaybackSource[] | null,
  props: UseAudioProps = {},
): Audio | null {
  const { speed = 1 } = props;
  const globalPlayStatus = useRef({ rate: 1 }).current;
  const audio = useRef<
    | {
        state: "resolved";
        currentTrack: number;
        switchingTrack: boolean | null; // null == cancelled
        sounds: Audio.Sound[];
      }
    | {
        state: "pending";
        prom: ExteriorPromise<void>;
        status: AVPlaybackStatusToSet & { track: number };
      }
    | undefined
  >();
  const [currentTrack, setCurrentTrack] = useState<number>(0);
  const [status, setStatus] = useState<Status>(defaultStatus);
  const setStatusAsync = useCallback<SetStatusAsync>(
    (status) => {
      if ("rate" in status) globalPlayStatus.rate = status.rate;
      if (audio.current?.state == "resolved") {
        const curAudio = audio.current;
        return (async () => {
          const statusToSet = {
            ...globalPlayStatus,
            ...("nextTrack" in status ? { positionMillis: 0, shouldPlay: true } : status),
          };
          if ("nextTrack" in status) {
            curAudio.currentTrack++;
            curAudio.switchingTrack = true;
          } else if ("positionMillis" in status && status.track !== curAudio.currentTrack) {
            const prev = curAudio.sounds[curAudio.currentTrack];
            curAudio.currentTrack = status.track;
            curAudio.switchingTrack = true;
            await prev.setStatusAsync({ positionMillis: 0, shouldPlay: false });
          } else if ("shouldPlay" in status && !status.shouldPlay) {
            curAudio.switchingTrack = null;
          } else {
            curAudio.switchingTrack = false;
          }
          await curAudio.sounds[curAudio.currentTrack].setStatusAsync(statusToSet);
        })();
      } else {
        audio.current ??= { state: "pending", prom: exteriorPromise(), status: { track: 0 } };
        Object.assign(audio.current.status, status);
        return audio.current.prom.promise;
      }
    },
    [title],
  );
  const methods = useMemo(() => makeAudioMethods(setStatusAsync), [setStatusAsync]);
  useEffect(() => {
    if (!title) return;
    const initialStatus = {
      progressUpdateIntervalMillis: __DEV__ ? 500 : 50,
      shouldCorrectPitch: true,
      pitchCorrectionQuality: Audio.PitchCorrectionQuality.Low,
    };

    Promise.all(
      title.map((title, i) =>
        Audio.Sound.createAsync(title, initialStatus, async (status) => {
          if (!status.isLoaded) {
            setStatus(defaultStatus);
            if (status.error) console.error(status.error);
            return;
          }
          if (audio.current?.state !== "resolved" || audio.current.currentTrack !== i) return;
          setCurrentTrack(i);
          if (status.didJustFinish && i + 1 < audio.current.sounds.length) {
            if (audio.current.switchingTrack == null) {
              audio.current.currentTrack++;
              audio.current.switchingTrack = false;
            } else {
              setStatusAsync({ nextTrack: true });
            }
          } else {
            status = { ...status };
            if (audio.current.switchingTrack) {
              if (status.isPlaying) audio.current.switchingTrack = false;
              else status.isPlaying = true;
            }
            setStatus(status);
          }
        }).then(({ sound }) => sound),
      ),
    ).then(async (sounds) => {
      setStatus((status) => ({ ...status, isLoaded: true }));
      let currentTrack = 0;
      if (audio.current?.state === "pending") {
        currentTrack = audio.current.status.track;
        setCurrentTrack(currentTrack);
        audio.current.prom.resolve(
          sounds[currentTrack].setStatusAsync(audio.current.status).then(() => {}),
        );
      }
      audio.current = { state: "resolved", currentTrack, switchingTrack: false, sounds };
    });
    return () => {
      if (audio.current?.state === "resolved")
        for (const sound of audio.current.sounds) sound.unloadAsync();
      audio.current = undefined;
    };
  }, [title]);
  useEffect(() => {
    if (title == null) return;
    if (audio.current == null && speed === 1) {
      // don't need to do anything
    } else {
      setStatusAsync({ rate: speed });
    }
  }, [title == null, setStatusAsync, speed]);
  if (title == null) return null;
  return {
    loaded: status.isLoaded,
    currentTrack,
    currentTime: status.positionMillis / 1000,
    playing: status.isPlaying,
    speed: status.rate,
    ...methods,
  };
}

const makeAudioMethods = (setStatusAsync: SetStatusAsync): AudioMethods => ({
  setCurrentTime: (track: number, time: number) =>
    setStatusAsync({ positionMillis: time * 1000, shouldPlay: true, track }),
  play: () => setStatusAsync({ shouldPlay: true }),
  pause: () => setStatusAsync({ shouldPlay: false }),
  setSpeed: (speed: number) => setStatusAsync({ rate: speed }),
});
