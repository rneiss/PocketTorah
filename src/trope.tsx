import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { ScreenProps } from "./App";
import { PlayView } from "./PlayViewScreen";
import { getTropeAudio, getTropeLabels, getTropeText, hebFont } from "./assetImports";
import { CustomButton, Text } from "./theming";
import { ensureArray, useScreenTitle } from "./utils";

const tropeTypes = ["torah", "haftarah", "esther", "eicha", "3megillot", "hhd"] as const;
export type TropeType = (typeof tropeTypes)[number];

export const TropePhrases = ({ navigation }: ScreenProps<"TropePhrases">) => {
  useScreenTitle(navigation, "Tropes");
  return (
    <View>
      <ScrollView>
        {tropeTypes.map((tropeType) => (
          <CustomButton
            onPress={() => navigation.navigate("TropeSelectScreen", { tropeType })}
            key={tropeType}
            buttonTitle={getTropeText(tropeType).title}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const tropeChars: { [trope: string]: string | string[] } = {
  etnachta: "֑",
  sof_pasuk: "׃",
  zakef_katan: "֔",
  katon: "֔",
  revii: "֗",
  kadma_vazlan: ["֨", "֝"],
  geresh_gershayim: ["֜", "֞"],
  geresh: "֜",
  gershayim: "֞",
  tevir: "֛",
  telisha: ["֩", "֠"],
  pazer: "֡",
  yetiv_katom: ["֚", "֔"],
  zakef_gadol: "֕",
  zarka: "֮",
  mercha_kefulah: "֦",
  karnei_parah: "֟",
  yerech_ben_yomo: "֪",
  pashta_katon: ["֙", "֔"],
};

export const TropeSelectScreen = ({ route, navigation }: ScreenProps<"TropeSelectScreen">) => {
  const { tropeType } = route.params;
  const { title, tropes } = getTropeText(tropeType);
  useScreenTitle(navigation, `${title} Tropes`);
  return (
    <ScrollView>
      {Object.entries(tropes).map(([trope, { name_he }]) => (
        <CustomButton
          key={trope}
          onPress={() => navigation.navigate("TropePlayScreen", { tropeType, trope: trope })}
          textStyle={{ fontSize: 18 }}
          buttonTitle={
            <>
              {name_he}
              {trope in tropeChars && (
                <Text style={{ fontFamily: hebFont, fontSize: 25 }}>
                  {" ( " +
                    ensureArray(tropeChars[trope])
                      .map((x) => "ב" + x)
                      .join(" ") +
                    " )"}
                </Text>
              )}
            </>
          }
        />
      ))}
    </ScrollView>
  );
};

export const TropePlayScreen = ({ navigation, route }: ScreenProps<"TropePlayScreen">) => {
  const { tropeType, trope } = route.params;
  const typeInfo = getTropeText(tropeType);
  const tropeInfo = typeInfo.tropes[trope];
  const verses = useMemo(() => tropeInfo.text.map((words) => ({ words })), [tropeType, trope]);

  useScreenTitle(navigation, `${typeInfo.title} Tropes - ${tropeInfo.name_he}`);

  const audioSource = [getTropeAudio(tropeType, trope)];

  const audioLabels = useMemo(
    () => Promise.resolve([getTropeLabels(tropeType)[trope]]),
    [tropeType, trope],
  );

  return (
    <PlayView
      {...{ verses, audioSource, audioLabels, navigation }}
      forceLinebreakVerses
      singleVerseAudio
    />
  );
};
