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
  Alert,
  ActivityIndicator

} from 'react-native';
var RNFS = require('react-native-fs');
timeChecker = "";

import {
  StackNavigator,
} from 'react-navigation';


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



// Import the react-native-sound module
var Sound = require('react-native-sound');

// Enable playback in silence mode (iOS only)
Sound.setCategory('Playback');


const loadTorahReadingScreen = () => {
  Alert.alert('Button has been pressed!');
};

const loadThisWeeksTorahReading = () => {
  Alert.alert('Button has been pressed!');
};

const loadAboutPage = () => {
  Alert.alert('Button has been pressed!');
};


class CustomButton extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={this.props.doOnPress}>
        <Text style={styles.button}>
          {this.props.buttonTitle}
        </Text>
      </TouchableOpacity>
    );
  }
}

class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Home',
  };
  render() {
    const { navigate } = this.props.navigation;
    return (
      <ScrollView>
        <CustomButton doOnPress={() => navigate('TorahReadingsScreen')} buttonTitle="List of Torah Readings" />
        <CustomButton doOnPress={loadTorahReadingScreen} buttonTitle="This Week's Torah Readings" />
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
      <View>
        <Text>PocketTorah is a labor of love maintained by Russel Neiss & Charlie Schwartz.</Text>
        <Text>Initially funded by the Jewish New Media Innovation Fund, PocketTorah is designed to help you learn the weekly Torah and Haftarah portions anywhere, at any time, for free.</Text>
        <Text>If you like it, or find it useful, please consider making a donation to the Jewish charity of your choice.</Text>
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
    var aliyahData = require('./data/aliyah.json');
    var parshahArray = aliyahData.parshiot.parsha.map(x => x);

    //create button for each parsha
    var content = parshahArray.map((obj) => (<CustomButton doOnPress={() => navigate('AliyahSelectScreen', { parshah: obj._id, aliyot: obj.fullkriyah.aliyah, originatingBook: obj._verse.split(" ")[0] })} buttonTitle={obj._id} />) );

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

    return (
      <View>
        {content}
      </View>
    );
  }
}


class PlayViewScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: `${navigation.state.params.title}`,
  });



  constructor(props) {
    super(props);
    this.state = {
      audio: "",
      labels: "",
      curWordIndex: 0,
      activeWordIndex:0,
      audioPlaying: false,
    };
  }



  checkTime() {
    clearInterval(timeChecker);

    var wordIndex = this.state.activeWordIndex;
    if (this.state.audio == "" || this.state.labels == "") { return }

    this.state.audio.getCurrentTime((curTime) =>  {
      var changeTime = parseFloat(this.state.labels[wordIndex+1]);
      if (curTime > changeTime) {
        this.setState({
          activeWordIndex: wordIndex+1
        });
      }
    });

    timeChecker = setTimeout(() => {this.checkTime()});

  }

  toggleAudio(action) {
    if (action == 'play') {
      this.state.audio.play();
      this.setState({audioPlaying: true});
    }
    else {
      this.state.audio.pause();
      this.setState({audioPlaying: false});
    }
  }


  componentDidMount() {
    const { params } = this.props.navigation.state;
    var audioFileName = "audio/"+params.title.replace(/[ ’]/g, '')+"-"+ params.aliyahNum+".mp3";
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

    if (this.state.audio == "" || this.state.labels == "") {
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

      this.checkTime(1000);

      return (
        <View style={{flex: 1}}>
          <ScrollView>
            <TextFile activeWordIndex={this.state.activeWordIndex} originatingBook={params.originatingBook} sectionLength={params.length} chapterStartIndex={chapterStartIndex} verseStartIndex={verseStartIndex} />
          </ScrollView>
          <View>
            {this.state.audioPlaying ? <CustomButton doOnPress={() => this.toggleAudio('pause')} buttonTitle="Pause" /> : <CustomButton doOnPress={() => this.toggleAudio('play')} buttonTitle="Play" /> }

          </View>
        </View>
      );
    }
  }
}

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
          case 'ExodusTrans':
            return ExodusTrans;
          case 'DeuteronomyTrans':
            return DeuteronomyTrans;
          case 'LeviticusTrans':
            return LeviticusTrans;
          case 'NumbersTrans':
            return NumbersTrans;
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
    <View style={styles.text}><Verses activeWordIndex={this.props.activeWordIndex} book={selectedBook} transBook={selectedTrans} chapterStart={this.props.chapterStartIndex} verseStart={this.props.verseStartIndex} length={this.props.sectionLength} /></View>
  )
}
}


class Verses extends React.Component {

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
            <VerseWords activeWordIndex={this.props.activeWordIndex} curWordIndex={lastWordIndex} verse={book.c[curChapter].v[curVerse]} />
          );
          lastWordIndex = lastWordIndex + book.c[curChapter].v[curVerse].w.length;
          curVerse = curVerse + 1;
        }

  return (<View style={styles.text}>{verseText}</View>);

}
}


class VerseWords extends React.Component {
render() {
  var words = [];
  var verse = this.props.verse;
  for (i = 0; i < verse.w.length; i++) {


    words.push(<TouchableOpacity key={i}><Text style={this.props.curWordIndex+i == this.props.activeWordIndex? [styles.word, styles.active] : styles.word}>
      {verse.w[i].replace(/\//g, '')}
    </Text></TouchableOpacity>);
  }

  return (<View style={styles.text}>{words}</View>);
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
    fontSize: 36,
    fontFamily: "Taamey Frank Taamim Fix",
  },
  active: {
    backgroundColor: '#ffff9d',
  },


});

AppRegistry.registerComponent('PocketTorah', () => PocketTorah);
