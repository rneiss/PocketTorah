import React from "react";
import { Linking, Platform, View } from "react-native";
import { Text, useStyles, wrapComponent } from "./theming";

const AboutContainer = wrapComponent(View, "aboutPage");
const AboutText = wrapComponent(Text, "aboutPageText");
const AboutHeader = wrapComponent(Text, "aboutPageHeader");
const AboutListItem = wrapComponent(Text, "aboutPageListItem");

const Link: React.FC<React.PropsWithChildren<{ href: string }>> = Platform.select({
  web: ({ href, children }) => {
    const styles = useStyles();
    return (
      <a target="_blank" style={styles.externalLink as any} href={href}>
        {children}
      </a>
    );
  },
  default: ({ href, children }) => {
    const styles = useStyles();
    return (
      <Text style={styles.externalLink} onPress={() => Linking.openURL(href)}>
        {children}
      </Text>
    );
  },
});

export const AboutScreen = () => (
  <AboutContainer>
    <AboutText>
      PocketTorah is a labor of love maintained by Russel Neiss & Charlie Schwartz.
    </AboutText>
    <AboutText>
      Initially funded by the Jewish New Media Innovation Fund, PocketTorah is designed to help you
      learn the weekly Torah and Haftarah portions anywhere, at any time, for free.
    </AboutText>
    <AboutText>
      If you like it, or find it useful, please consider making a donation to the Jewish charity of
      your choice.
    </AboutText>
    <AboutHeader>Torah Readers:</AboutHeader>
    <View>
      <AboutListItem>Etta Abramson</AboutListItem>
      <AboutListItem>Joshua Foster</AboutListItem>
      <AboutListItem>Eitan Konigsberg</AboutListItem>
      <AboutListItem>Eytan Kurshan</AboutListItem>
      <AboutListItem>Ari Lucas</AboutListItem>
      <AboutListItem>Rabbi Ita Paskind</AboutListItem>
      <AboutListItem>Rebecca Russo</AboutListItem>
      <AboutListItem>Joshua Schwartz</AboutListItem>
      <AboutListItem>Abigail Teller</AboutListItem>
    </View>
    <AboutHeader>Trope Provided by:</AboutHeader>
    <View>
      <AboutListItem>Cantor Elizabeth K. Sacks</AboutListItem>
    </View>
    <AboutHeader>Text Sources:</AboutHeader>
    <View>
      <AboutListItem>
        Hebrew text:{" "}
        <Link href="https://en.wikisource.org/wiki/User:Dovi/Miqra_according_to_the_Masorah">
          Miqra According to the Masora
        </Link>
      </AboutListItem>
      <AboutListItem>
        English translation:{" "}
        <Link href="https://opensiddur.org/readings-and-sourcetexts/mekorot/tanakh/translations/tanakh-the-holy-scriptures-a-new-translation-jps-1917/">
          JPS Tanakh (1917, public domain)
        </Link>
        , processed digitally by{" "}
        <Link href="https://github.com/Sefaria/Sefaria-Data/tree/master/sources/JPS1917">
          Sefaria
        </Link>
      </AboutListItem>
    </View>
  </AboutContainer>
);
