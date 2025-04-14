import Slider from "@react-native-community/slider";
import React, { useEffect, useState } from "react";
import { Modal, Switch, TouchableOpacity, View } from "react-native";
import { Word, WordProps, getWordStyle } from "./PlayViewScreen";
import { UpdateSettings, useSettings } from "./settings";
import { CustomButton, ModalSection, Text, useStyles, wrapComponent } from "./theming";
import { Audio } from "./useAudio";

export const SettingsModal = ({
  audio,
  modalVisible,
  setModalVisible,
}: {
  audio: Audio | null;
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
}) => (
  <Modal
    animationType="slide"
    transparent={false}
    visible={modalVisible}
    onRequestClose={() => console.log("Modal has been closed.")}
  >
    <PlaySettings closeSettings={() => setModalVisible(false)} setAudioSpeed={audio?.setSpeed} />
  </Modal>
);
type PlaySettingsProps = {
  closeSettings: () => void;
  setAudioSpeed?: (speed: number) => void;
};

const WordWithStyle = (props: WordProps) => (
  <Text style={props.wordStyle.style}>
    <Word {...props} />
  </Text>
);
export function PlaySettings({ closeSettings, setAudioSpeed }: PlaySettingsProps) {
  const [settings, updateSettings] = useSettings();
  const [tempSettings, setTempSettings] = useState(settings);
  const updateTempSettings: UpdateSettings = (upd) =>
    setTempSettings((prev) => ({ ...prev, ...upd }));

  useEffect(() => {
    setAudioSpeed?.(tempSettings.audioSpeed);
  }, [setAudioSpeed, tempSettings.audioSpeed]);

  const styles = useStyles();

  const breishit = "בְּרֵאשִׁ֖ית";
  return (
    <View style={[styles.modalContainer, { height: "100%" }, styles.baseBackground]}>
      <Text style={styles.modalHeader}>Settings</Text>
      <ModalSection>
        <Text>Font Size:</Text>
        <Slider
          minimumValue={0.5}
          maximumValue={2}
          value={tempSettings.textSize}
          onValueChange={(textSize) => updateTempSettings({ textSize })}
        />
        <WordWithStyle word={breishit} wordStyle={getWordStyle(false, tempSettings.textSize)} />
        <WordWithStyle word={breishit} wordStyle={getWordStyle(true, tempSettings.textSize)} />
      </ModalSection>
      {setAudioSpeed && (
        <ModalSection>
          <Text>Set Audio Speed:</Text>
          <Slider
            minimumValue={0.5}
            maximumValue={2}
            value={tempSettings.audioSpeed}
            onSlidingComplete={(audioSpeed) => updateTempSettings({ audioSpeed })}
          />
        </ModalSection>
      )}

      <ModalSection>
        <SettingsRow>
          <Text>Triennial?</Text>
          <Switch value={tempSettings.tri} onValueChange={(tri) => updateTempSettings({ tri })} />
        </SettingsRow>
        <SettingsRow>
          <Text>Israeli Holiday Scheme?</Text>
          <Switch value={tempSettings.il} onValueChange={(il) => updateTempSettings({ il })} />
        </SettingsRow>
      </ModalSection>

      <View style={styles.modalFooter}>
        <CustomButton
          onPress={() => {
            updateSettings(tempSettings);
            closeSettings();
          }}
          buttonTitle="Save Settings"
        />
        <CustomButton
          onPress={() => {
            closeSettings();
            setAudioSpeed?.(settings.audioSpeed);
          }}
          buttonTitle="Cancel"
        />
      </View>

      <ModalSection>
        <SettingsRow>
          <Text>Color Scheme</Text>
          <View style={{ flexDirection: "row" }}>
            {(["auto", "light", "dark"] as const).map((colorTheme) => (
              <TouchableOpacity key={colorTheme} onPress={() => updateSettings({ colorTheme })}>
                <Text style={[{ padding: 4 }, settings.colorTheme === colorTheme && styles.active]}>
                  {titlecase(colorTheme)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingsRow>
      </ModalSection>
    </View>
  );
}
const SettingsRow = wrapComponent(View, "settingsRow");
const titlecase = (s: string) => s.slice(0, 1).toUpperCase() + s.slice(1);
