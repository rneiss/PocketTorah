/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Button,
  Modal,
  Slider,

} from 'react-native';
var RNFS = require('react-native-fs');
timeChecker = "";

var reactMixin = require('react-mixin');
var TimerMixin = require('react-timer-mixin');


import {
  StackNavigator,
} from 'react-navigation';

import calendar from './data/calendar.json';
import aliyahData from './data/aliyah.json';

// Import Texts
import Amos from './data/torah/json/Amos.json';
import Deuteronomy from './data/torah/json/Deuteronomy.json';
import Exodus from './data/torah/json/Exodus.json';
import Ezekiel from './data/torah/json/Ezekiel.json';
import Genesis from './data/torah/json/Genesis.json';
import Hosea from './data/torah/json/Hosea.json';
import Isaiah from './data/torah/json/Isaiah.json';
import Jeremiah from './data/torah/json/Jeremiah.json';
import Joel from './data/torah/json/Joel.json';
import Joshua from './data/torah/json/Joshua.json';
import Judges from './data/torah/json/Judges.json';
import Kings_1 from './data/torah/json/Kings_1.json';
import Kings_2 from './data/torah/json/Kings_2.json';
import Leviticus from './data/torah/json/Leviticus.json';
import Malachi from './data/torah/json/Malachi.json';
import Micah from './data/torah/json/Micah.json';
import Numbers from './data/torah/json/Numbers.json';
import Obadiah from './data/torah/json/Obadiah.json';
import Samuel_1 from './data/torah/json/Samuel_1.json';
import Samuel_2 from './data/torah/json/Samuel_2.json';
import Zechariah from './data/torah/json/Zechariah.json';

// Import Translations
import GenesisTrans from './data/torah/translation/Genesis.json';
import ExodusTrans from './data/torah/translation/Exodus.json';
import DeuteronomyTrans from './data/torah/translation/Deuteronomy.json';
import LeviticusTrans from './data/torah/translation/Leviticus.json';
import NumbersTrans from './data/torah/translation/Numbers.json';
import IsaiahTrans from './data/torah/translation/Isaiah.json';
import JoshuaTrans from './data/torah/translation/Joshua.json';
import JudgesTrans from './data/torah/translation/Judges.json';
import MalachiTrans from './data/torah/translation/Malachi.json';
import ObadiahTrans from './data/torah/translation/Obadiah.json';
import Samuel_1Trans from './data/torah/translation/Samuel_1.json';
import Samuel_2Trans from './data/torah/translation/Samuel_2.json';
import ZechariahTrans from './data/torah/translation/Zechariah.json';
import JoelTrans from './data/torah/translation/Joel.json';
import JeremiahTrans from './data/torah/translation/Jeremiah.json';
import HoseaTrans from './data/torah/translation/Hosea.json';
import EzekielTrans from './data/torah/translation/Ezekiel.json';
import AmosTrans from './data/torah/translation/Amos.json';
import Kings_2Trans from './data/torah/translation/Kings_2.json';
import Kings_1Trans from './data/torah/translation/Kings_1.json';


// Import the react-native-sound module
var Sound = require('react-native-sound');

// Enable playback in silence mode (iOS only)
Sound.setCategory('Playback');



class CustomButton extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={this.props.doOnPress} style={this.props.style ? this.props.style : null} >
        <Text style={styles.button}>
          {this.props.buttonTitle}
        </Text>
      </TouchableOpacity>
    );
  }
}

class FooterButton extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={this.props.doOnPress} style={this.props.style ? this.props.style : null} >
        <Text style={styles.footerButtonInner}>
          {this.props.buttonTitle}
        </Text>
      </TouchableOpacity>
    );
  }
}



class HomeScreen extends React.Component {
  static navigationOptions = {
    title:  "Home",
  };
  render() {
    const { navigate } = this.props.navigation;

    //figure out current parshah
    let parashah;
    let weekOffset = 1;


    while (!parashah) {
      let date = new Date();
      date.setDate(date.getDate() + (6 - 1 - date.getDay() + 7) % 7 + weekOffset);
      var day = date.getDate();
      var month = date.getMonth()+1; //January is 0!
      var year = date.getFullYear();
      dateString = month + '/' + day + '/' + year;
      parashah = calendar[dateString];
      weekOffset += 1;
    }

    let parshahLookup;

    for (q = 0; q < aliyahData.parshiot.parsha.length; q++) {

      if (aliyahData.parshiot.parsha[q]._id.replace(/[ ’]/g, '\'') == parashah.name ) {
        parshahLookup = aliyahData.parshiot.parsha[q];
        break;
      }

    }
    //</end current parshah lookup>

    return (
      <ScrollView>
        <CustomButton doOnPress={() => navigate('TorahReadingsScreen')} buttonTitle="List of Torah Readings" />
        <CustomButton doOnPress={() => navigate('AliyahSelectScreen',{ parshah: parshahLookup._id, haftara: parshahLookup._haftara, haftaraLength: parshahLookup._haftaraLength, haftaraLength2: parshahLookup._haftaraLength2,  maftirOffset: parshahLookup.maftirOffset, aliyot: parshahLookup.fullkriyah.aliyah, originatingBook: parshahLookup._verse.split(" ")[0] })}  buttonTitle="This Week's Torah Readings" />
        <CustomButton doOnPress={() => navigate('About')} buttonTitle="About this App" />
      </ScrollView>
    );
  }
}

class AboutScreen extends React.Component {
  static navigationOptions = {
    title: 'About',
  };
  render() {
    return (
      <View style={styles.aboutPage}>
        <Text style={styles.aboutPageText}>PocketTorah is a labor of love maintained by Russel Neiss & Charlie Schwartz.</Text>
        <Text style={styles.aboutPageText}>Initially funded by the Jewish New Media Innovation Fund, PocketTorah is designed to help you learn the weekly Torah and Haftarah portions anywhere, at any time, for free.</Text>
        <Text style={styles.aboutPageText}>If you like it, or find it useful, please consider making a donation to the Jewish charity of your choice.</Text>
        <Text style={styles.aboutPageHeader}>Torah Readers:</Text>
        <View>
          <Text style={styles.aboutPageListItem}>Etta Abramson</Text>
          <Text style={styles.aboutPageListItem}>Joshua Foster</Text>
          <Text style={styles.aboutPageListItem}>Eitan Konigsberg</Text>
          <Text style={styles.aboutPageListItem}>Eytan Kurshan</Text>
          <Text style={styles.aboutPageListItem}>Ari Lucas</Text>
          <Text style={styles.aboutPageListItem}>Rabbi Ita Paskind</Text>
          <Text style={styles.aboutPageListItem}>Rebecca Russo</Text>
          <Text style={styles.aboutPageListItem}>Joshua Schwartz</Text>
          <Text style={styles.aboutPageListItem}>Abigail Teller</Text>
        </View>
      </View>
    );
  }
}

class TorahReadingsScreen extends React.Component {
  static navigationOptions = {
    title: 'Torah Readings',
  };
  render() {
    //convert parshah json to array
    var parshahArray = aliyahData.parshiot.parsha.map(x => x);

    //create button for each parsha
    var content = parshahArray.map((obj) => (<CustomButton doOnPress={() => navigate('AliyahSelectScreen', { parshah: obj._id, haftara: obj._haftara, haftaraLength: obj._haftaraLength, haftaraLength2: obj._haftaraLength2,  maftirOffset: obj.maftirOffset, aliyot: obj.fullkriyah.aliyah, originatingBook: obj._verse.split(" ")[0] })} buttonTitle={obj._id} />) );

    const { params } = this.props.navigation.state;
    const { navigate } = this.props.navigation;
    return (
      <View>
        <ScrollView>
          {content}
        </ScrollView>
      </View>
    );
  }
}

class AliyahSelectScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: `${navigation.state.params.parshah}`,
  });
  render() {
    const { params } = this.props.navigation.state;
    const { navigate } = this.props.navigation;
    var content = params.aliyot.map((obj) => (<CustomButton doOnPress={() => navigate('PlayViewScreen', { parshah: obj._id, aliyotStart: obj._begin, aliyotEnd: obj._end, length: obj._numverses, title: params.parshah, originatingBook: params.originatingBook, aliyahNum: obj._num })} buttonTitle={obj._num !="M" ? "Aliyah "+obj._num+": "+obj._begin+"-"+obj._end : "Maftir Aliyah"+": "+obj._begin+"-"+obj._end} />) );
    if (params.haftara) {
      var hafTitle = params.haftara.split(' ')[0];
      var hafStart = params.haftara.split(' ')[1];
      var hafEnd = params.haftara.split(' ')[3];
      if (params.haftaraLength2) {
        var hafStart2 = params.haftara.split(';')[1].split(' ')[1];
        var hafEnd2 = params.haftara.split(';')[1].split(' ')[3];
      }

      content.push(
        <CustomButton doOnPress={() => navigate('PlayViewScreen', {parshah: hafTitle, hafStart2: hafStart2, hafEnd2: hafEnd2, aliyotStart: hafStart, aliyotEnd: hafEnd, length: params.haftaraLength, length2: params.haftaraLength2, title: params.parshah, originatingBook: hafTitle, aliyahNum: "H" })} buttonTitle={"Haftarah"+": "+hafTitle.replace(/_/g, ' ')+" "+hafStart+"-"+hafEnd} />
      );
    }
    return (
      <View>
        {content}
      </View>
    );
  }
}


class PlayViewScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
      const { state } = navigation;
      const { renderHeaderRight } = state.params;
      return {
          title: `${navigation.state.params.title}`,
          headerRight: renderHeaderRight && renderHeaderRight()
      }
  };

  componentWillMount() {
      this.props.navigation.setParams({
          renderHeaderRight: () => <Button title={"Settings"} onPress={() => this.toggleSettingsModal('open')} />
      });
  }

  constructor(props) {
    super(props);
    this.state = {
      audio: null,
      labels: null,
      activeWordIndex:0,
      audioPlaying: false,
      translationOn: false,
      tikkunOn: false,
      modalVisible: false,
      textSizeMultiplier: 1,
      maftirWordOffset: 0,
      currentAudioTime: 0,
    };
    this.changeAudioTime = this.changeAudioTime.bind(this);

  }



  checkTime() {
    this.clearInterval(timeChecker);

    var wordIndex = this.state.activeWordIndex;
    if (!this.state.audio || !this.state.labels ) { return }

    this.state.audio.getCurrentTime((curTime) =>  {
      var changeTime = parseFloat(this.state.labels[wordIndex+1]);
      if (curTime > changeTime) {
        this.setState({
          activeWordIndex: wordIndex+1
        });
      }
    });
    timeChecker = this.setTimeout(() => {this.checkTime()});

  }

  toggleAudio(action) {
    if (action == 'play') {
      if (this.state.maftirWordOffset > 0) {
        this.state.audio.getCurrentTime((seconds) => {
          if (seconds == 0) {
            this.changeAudioTime(parseInt(this.state.maftirWordOffset));
          }
        });
      }

      this.state.audio.play();
      this.setState({audioPlaying: true});

      this.setInterval( () => {
        this.state.audio.getCurrentTime((curTime) =>  {
            this.setState({
              currentAudioTime: curTime
            });
        });
     }, 50);

    }
    else {
      this.state.audio.pause();
      this.setState({audioPlaying: false});
    }
  }

  changeAudioTime(wordIndex){
    if (!this.state.audio || !this.state.labels ) { return }
    this.toggleAudio('pause');
    var newTime = parseFloat(this.state.labels[wordIndex]);
    this.state.audio.setCurrentTime(newTime);
    this.setState({activeWordIndex: wordIndex});
    this.toggleAudio('play');
  }

  toggleTranslation(action) {
    if (action == 'on') {
      this.setState({translationOn: true});
    }
    else {
      this.setState({translationOn: false});
    }
  }

  toggleSettingsModal(action) {
    if (action == 'open') {
      this.setState({modalVisible: true});
    }
    else {
      this.setState({modalVisible: false});
    }
  }

  toggleTikkun(action) {
    if (action == 'on') {
      this.setState({tikkunOn: true});
    }
    else {
      this.setState({tikkunOn: false});
    }
  }


  componentDidMount() {
    var { params } = this.props.navigation.state;
    if (params.aliyahNum == "M") {
      params.aliyahNum = "7";
      this.setState({
        maftirWordOffset: params.maftirOffset,
        activeWordIndex: params.maftirOffset
      });
    }
    var audioFileName = "audio/" + params.title.replace(/[ ’]/g, '') + "-" + params.aliyahNum + ".mp3";
    var aliyahAudio = new Sound(audioFileName, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
      this.setState({audio: aliyahAudio});
    });


    RNFS.readFile(RNFS.MainBundlePath+'/labels/'+params.title+'-'+ params.aliyahNum+'.txt') // On Android, use "RNFS.DocumentDirectoryPath" (MainBundlePath is not defined)
      .then((contents) => {
        // log the file contents
        this.setState({
          labels: contents.split(','),
        });

      })
      .catch((err) => {
        console.log(err.message, err.code);
      });
  }

  componentWillUnmount() {
      this.state.audio.release();
  }
  render() {

    if (!this.state.audio || !this.state.labels ) {
    return (
      <View>
        <ActivityIndicator
          size="large"
        />
        <Text>Loading....</Text>
      </View>
    );

    }

    else {
      const {params} = this.props.navigation.state;
      var chapterStart = params.aliyotStart.split(':')[0];
      var verseStart = params.aliyotStart.split(':')[1];
      var chapterStartIndex = chapterStart - 1;
      var verseStartIndex = verseStart - 1;
      var wordFontSize = 24*parseFloat(this.state.textSizeMultiplier);
      var stamFontSize = 20*parseFloat(this.state.textSizeMultiplier);



      return (
        <View style={{flex: 1}}>
        <Modal
          animationType={"slide"}
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {console.log("Modal has been closed.")}}
          >
         <View style={{marginTop: 22}}>
          <View>
              <Text style={styles.modalHeader}>Settings</Text>
            <View style={styles.modalSection}>
              <Text>Font Size:</Text>
              <Slider minimumValue={.5} maximumValue={2} value={this.state.textSizeMultiplier} onSlidingComplete={(value) => this.setState({textSizeMultiplier: value})} />
              <Text style={[styles.word,{fontSize: wordFontSize}]}>בְּרֵאשִׁ֖ית </Text>
              <Text style={[styles.stam,{fontSize: stamFontSize}]}>בראשית </Text>
            </View>
            <View style={styles.modalSection}>
              <Text>Set Audio Speed:</Text>
              <Slider minimumValue={.5} maximumValue={2} value={1} onValueChange={(value) => this.state.audio.setSpeed(value)} />
            </View>

            <View style={styles.modalFooter}>
              <CustomButton doOnPress={() => this.toggleSettingsModal('close')} buttonTitle="Save Settings" />
            </View>

          </View>
         </View>
        </Modal>
          <ScrollView>
            <TextFile changeAudioTime={this.changeAudioTime} translationFlag={this.state.translationOn} tikkunFlag={this.state.tikkunOn} textSizeMultiplier={this.state.textSizeMultiplier} currentAudioTime={this.state.currentAudioTime} activeWordIndex={this.state.activeWordIndex} labels={this.state.labels} maftirWordOffset={this.state.maftirWordOffset} originatingBook={params.originatingBook} sectionLength={params.length} chapterStartIndex={chapterStartIndex} verseStartIndex={verseStartIndex} length2={params.length2} hafStart2={params.hafStart2} />
          </ScrollView>
          <View style={styles.footer}>
            {this.state.audioPlaying ? <FooterButton style={styles.footerButton} doOnPress={() => this.toggleAudio('pause')} buttonTitle="Pause" /> : <FooterButton style={styles.footerButton} doOnPress={() => this.toggleAudio('play')} buttonTitle="Play" /> }
            {this.state.translationOn ? <FooterButton style={styles.footerButton} doOnPress={() => this.toggleTranslation('off')} buttonTitle="Translation Off" /> : <FooterButton style={styles.footerButton} doOnPress={() => this.toggleTranslation('on')} buttonTitle="Translation On" /> }
            {this.state.tikkunOn ? <FooterButton style={styles.footerButton} doOnPress={() => this.toggleTikkun('off')} buttonTitle="Tikkun Off" /> : <FooterButton style={styles.footerButton} doOnPress={() => this.toggleTikkun('on')} buttonTitle="Tikkun On" /> }
          </View>
        </View>
      );
    }
  }
}
reactMixin(PlayViewScreen.prototype, TimerMixin);


class TextFile extends React.Component {
render() {
  var bookText = (function(book) {
        switch (book) {
          case 'Amos':
            return Amos.Tanach.tanach.book;
          case 'Deuteronomy':
            return Deuteronomy.Tanach.tanach.book;
          case 'Exodus':
            return Exodus.Tanach.tanach.book;
          case 'Ezekiel':
            return Ezekiel.Tanach.tanach.book;
          case 'Genesis':
            return Genesis.Tanach.tanach.book;
          case 'GenesisTrans':
            return GenesisTrans;
          case 'IsaiahTrans':
            return IsaiahTrans;
          case 'ExodusTrans':
            return ExodusTrans;
          case 'DeuteronomyTrans':
            return DeuteronomyTrans;
          case 'LeviticusTrans':
            return LeviticusTrans;
          case 'NumbersTrans':
            return NumbersTrans;
          case 'JoshuaTrans':
             return JoshuaTrans;
          case 'JudgesTrans':
             return JudgesTrans;
          case 'MalachiTrans':
             return MalachiTrans;
          case 'ObadiahTrans':
             return ObadiahTrans;
          case 'Samuel_1Trans':
             return Samuel_1Trans;
          case 'Samuel_2Trans':
             return Samuel_2Trans;
          case 'ZechariahTrans':
             return ZechariahTrans;
          case 'JoelTrans':
             return JoelTrans;
          case 'JeremiahTrans':
             return JeremiahTrans;
          case 'HoseaTrans':
             return HoseaTrans;
          case 'EzekielTrans':
             return EzekielTrans;
          case 'AmosTrans':
             return AmosTrans;
          case 'Kings_2Trans':
             return Kings_2Trans;
          case 'Kings_1Trans':
             return Kings_1Trans;
          case 'Hosea':
            return Hosea.Tanach.tanach.book;
          case 'Isaiah':
            return Isaiah.Tanach.tanach.book;
          case 'Jeremiah':
            return Jeremiah.Tanach.tanach.book;
          case 'Joel':
            return Joel.Tanach.tanach.book;
          case 'Joshua':
            return Joshua.Tanach.tanach.book;
          case 'Judges':
            return Judges.Tanach.tanach.book;
          case 'Kings_1':
            return Kings_1.Tanach.tanach.book;
          case 'Kings_2':
            return Kings_2.Tanach.tanach.book;
          case 'Leviticus':
            return Leviticus.Tanach.tanach.book;
          case 'Malachi':
            return Malachi.Tanach.tanach.book;
          case 'Micah':
            return Micah.Tanach.tanach.book;
          case 'Numbers':
            return Numbers.Tanach.tanach.book;
          case 'Obadiah':
            return Obadiah.Tanach.tanach.book;
          case 'Samuel_1':
            return Samuel_1.Tanach.tanach.book;
          case 'Samuel_2':
            return Samuel_2.Tanach.tanach.book;
          case 'Zechariah':
            return Zechariah.Tanach.tanach.book;
        }
      });
  var selectedBook = bookText(this.props.originatingBook);
  var selectedTrans = bookText(this.props.originatingBook + "Trans");
  return (
    <View style={styles.text}><Verses changeAudioTime={this.props.changeAudioTime} translationFlag={this.props.translationFlag} tikkunFlag={this.props.tikkunFlag} textSizeMultiplier={this.props.textSizeMultiplier} currentAudioTime={this.props.currentAudioTime} activeWordIndex={this.props.activeWordIndex} labels={this.props.labels} maftirWordOffset={this.props.maftirWordOffset} book={selectedBook} transBook={selectedTrans} chapterStart={this.props.chapterStartIndex} verseStart={this.props.verseStartIndex} length={this.props.sectionLength} length2={this.props.length2} hafStart2={this.props.hafStart2}  /></View>
  )
}
}


class Verses extends React.Component {

  getVerseWords(verse, labels, curWordIndex, curChapterIndex, curVerseIndex,) {
    var maftirWordOffset = parseInt(this.props.maftirWordOffset);
    if (this.props.tikkunFlag) {

      var words = verse.w.map((word, i) =>
        <View style={styles.text}>
          {i == 0 ? <Text style={styles.verseNum}>{curChapterIndex + 1}:{curVerseIndex + 1}</Text> : null}
          <TouchableOpacity onPress={() => {
            this.props.changeAudioTime(curWordIndex + i + maftirWordOffset)
          }}>
            <Text style={parseFloat(this.props.labels[curWordIndex + i + maftirWordOffset]) < this.props.currentAudioTime && parseFloat(this.props.labels[curWordIndex + i + maftirWordOffset+1]) > this.props.currentAudioTime ? [styles.stam, styles.active, {fontSize: 30*this.props.textSizeMultiplier}] : [styles.stam,{fontSize: 30*this.props.textSizeMultiplier}]}>
              {verse.w[i].replace(/\//g, '').replace(/[\u0591-\u05C7]/g,"")}
            </Text>
          </TouchableOpacity>
        </View>
      );

      return words;
    }

    else {

      var words = verse.w.map((word, i) =>
        <View style={styles.text}>
          {i == 0 ? <Text style={styles.verseNum}>{curChapterIndex + 1}:{curVerseIndex + 1}</Text> : null}
          <TouchableOpacity key={curWordIndex + i + maftirWordOffset} onPress={() => {
            this.props.changeAudioTime(curWordIndex + i + maftirWordOffset)
          }}>
            <Text style={parseFloat(this.props.labels[curWordIndex + i + maftirWordOffset]) < this.props.currentAudioTime && parseFloat(this.props.labels[curWordIndex + i + maftirWordOffset+1]) > this.props.currentAudioTime ? [styles.word, styles.active,{fontSize: 36*this.props.textSizeMultiplier}] : [styles.word,{fontSize: 36*this.props.textSizeMultiplier}]}>
              {verse.w[i].replace(/\//g, '')}
            </Text>
          </TouchableOpacity>
        </View>
      );

      return words;

    }
  }


  render() {

        var verseText = [];
        var curChapter = this.props.chapterStart;
        var curVerse = this.props.verseStart;
        var book = this.props.book;
        var transBook = this.props.transBook;
        var lastWordIndex = 0;
        for (q = 0; q < this.props.length; q++) {
          if (!book.c[curChapter].v[curVerse]) {
            curChapter = curChapter + 1;
            curVerse = 0;
          }
          verseText.push(
            this.getVerseWords(book.c[curChapter].v[curVerse],this.props.activeWordIndex,lastWordIndex,curChapter,curVerse)
          );
          if (this.props.translationFlag) {
            verseText.push(
              <View><Text>{transBook.text[curChapter][curVerse]}</Text></View>
            );
          }

          lastWordIndex = lastWordIndex + book.c[curChapter].v[curVerse].w.length;
          curVerse = curVerse + 1;
        }

        if (this.props.length2) {
          var curChapter = parseInt(this.props.hafStart2.split(':')[0])-1;
          var curVerse = parseInt(this.props.hafStart2.split(':')[1])-1;
          for (z = 0; z < this.props.length2; z++) {
            if (!book.c[curChapter].v[curVerse]) {
              curChapter = curChapter + 1;
              curVerse = 0;
            }
            verseText.push(
              this.getVerseWords(book.c[curChapter].v[curVerse],this.props.activeWordIndex,lastWordIndex,curChapter,curVerse)
            );
            if (this.props.translationFlag) {
              verseText.push(
                <View><Text>{transBook.text[curChapter][curVerse]}</Text></View>
              );
            }

            lastWordIndex = lastWordIndex + book.c[curChapter].v[curVerse].w.length;
            curVerse = curVerse + 1;
          }

        }

  return (<View style={styles.text}>{verseText}</View>);

}
}








const PocketTorah = StackNavigator({
  Home: { screen: HomeScreen },
  About: { screen: AboutScreen },
  TorahReadingsScreen: { screen: TorahReadingsScreen },
  AliyahSelectScreen: { screen: AliyahSelectScreen },
  PlayViewScreen: { screen: PlayViewScreen },
});



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    top: 30,
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 20,
    marginRight: 10,
    marginLeft: 10,
    marginBottom: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  button: {
    margin: 10,
    padding: 10,
    backgroundColor: '#ccc',
    textAlign: 'center',
  },

  text: {
    flexDirection:'row-reverse',
    flexWrap:'wrap',
    alignItems:'flex-start',
  },

  word: {
    flex:0,
    padding: 4,
    fontFamily: "Taamey Frank Taamim Fix",
  },
  stam: {
    flex:0,
    padding: 4,
    fontFamily: "Stam Ashkenaz CLM",
  },
  active: {
    backgroundColor: '#ffff9d',
  },
  footer: {
    flexDirection:'row',
    alignItems: 'stretch',
    alignContent: 'stretch',
  },
  footerButton: {
    flexGrow: 1,
    width: 10,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#efeff2',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#d9d9de',

  },
  footerButtonInner: {
    fontSize: 12,
    textAlign: 'center',
  },
  verseNum: {
    paddingTop: 10,
    fontSize: 10,
  },
  modalHeader: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalSection: {
    borderColor: '#d9d9de',
    borderTopWidth: 1,
    marginTop: 10,
    padding: 10,
  },
  modalFooter: {
    marginTop: 50,
  },
  aboutPage: {
    margin: 10,
  },
  aboutPageText: {
    marginTop: 10,
  },
  aboutPageHeader: {
    fontWeight: "bold",
    marginTop: 10,
  },
  aboutPageListItem: {
    marginLeft: 10,
    marginTop: 5,
  },
});

AppRegistry.registerComponent('PocketTorah', () => PocketTorah);
