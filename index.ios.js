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
  Alert

} from 'react-native';

import {
  StackNavigator,
} from 'react-navigation';


const loadTorahReadingScreen = () => {
  Alert.alert('Button has been pressed!');
};

const loadThisWeeksTorahReading = () => {
  Alert.alert('Button has been pressed!');
};

const loadAboutPage = () => {
  Alert.alert('Button has been pressed!');
};


class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Home',
  };
  render() {
    const { navigate } = this.props.navigation;
    return (
      <ScrollView>

        <TouchableOpacity onPress={() => navigate('TorahReadingsScreen')}>
          <Text style={styles.button}>
            List of Torah Readings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={loadTorahReadingScreen}>
          <Text style={styles.button}>
            This Week's Torah Readings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigate('About')}>
          <Text style={styles.button}>
            About this App
          </Text>
        </TouchableOpacity>
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
    var aliyahData = require('./data/aliyah.json');

    const { navigate } = this.props.navigation;
    return (
      <View>
        <TouchableOpacity onPress={() => navigate('AliyahSelectScreen')}>
          <Text style={styles.button}>
            Genesis
            {aliyahData.parshiot.parsha[0]._id}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

class AliyahSelectScreen extends React.Component {
  static navigationOptions = {
    title: 'Aliyot',
  };
  render() {
    const { navigate } = this.props.navigation;
    return (
      <View>
        <TouchableOpacity onPress={() => navigate('PlayViewScreen')}>
          <Text style={styles.button}>
            Aliyah 1
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
}

class PlayViewScreen extends React.Component {
  static navigationOptions = {
    title: 'Parshah Name',
  };
  render() {
    return (
      <View>
      </View>
    );
  }
}


const PocketTorah = StackNavigator({
  Home: { screen: HomeScreen },
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
  }
});

AppRegistry.registerComponent('PocketTorah', () => PocketTorah);
