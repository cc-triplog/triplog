import React from "react";
import {
  AppRegistry,
  Animated,
  Button,
  Dimensions,
  Image,
  Platform,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import './styles'
import { WebBrowser, Component } from "expo";
import { getTheme } from 'react-native-material-kit';
import MapView from "react-native-maps";
import { MonoText } from "../components/StyledText";
import axios from 'axios';
import connect from 'react-redux';

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = height / 4;
const CARD_WIDTH = CARD_HEIGHT - 50;

let modalContent;


class MapScreen extends React.Component {
  static navigationOptions = {
    header: null
  };
  constructor(props) {
    super(props);
    this.state = {
      markers: [],
      region: {
        latitude: 35.6591246694541,
        longitude: 139.728567802469,
        latitudeDelta: 0.04864195044303443,
        longitudeDelta: 0.040142817690068,
      },
      visible: false,
    };
  }


    componentWillMount() {
    this.index = 0;
    this.animation = new Animated.Value(0);
    this.callDatabase()

  }

  componentDidMount() {
    // We should detect when scrolling has stopped then animate
    // We should just debounce the event listener here
    this.animation.addListener(({ value }) => {
      let index = Math.floor(value / CARD_WIDTH + 0.3); // animate 30% away from landing on the next item
      if (index >= this.state.markers.length) {
        index = this.state.markers.length - 1;
      }
      if (index <= 0) {
        index = 0;
      }

      clearTimeout(this.regionTimeout);
      this.regionTimeout = setTimeout(() => {
        if (this.index !== index) {
          this.index = index;
          const { coordinate } = this.state.markers[index];
          this.map.animateToRegion(
            {
              ...coordinate,
              latitudeDelta: this.state.region.latitudeDelta,
              longitudeDelta: this.state.region.longitudeDelta,
            },
            350
          );
        }
      }, 10);
    });

  }

  callDatabase() {
    axios({
      url: 'http://ec2-54-199-164-132.ap-northeast-1.compute.amazonaws.com:4000/graphql',
      method: 'post',
      data: {
        query: `
        query {ReadPhoto(type: {
        }) {
         title, latitude, longitude, comment, imageFile
        }
      }
        `
      }
    }).then(result => {
      const mapResult = result.data.data.ReadPhoto.map(object => (
      {
        coordinate: {
          latitude: Number(object.latitude),
          longitude: Number(object.longitude),
        },
        title: `${object.title}`,
        description: `${object.comment}`,
        image: { uri: `data:image/jpg;base64,${object.imageFile}` }, 
      }
    ));

    for(let i = 0; i < mapResult.length; i++) {
      mapResult[i].index = i;
    }
    mapResult.forEach(eachObject => {
      this.setState(
        {
          markers: [...this.state.markers, eachObject]
        }
      )
    })

    })
  }

  onPressPopUpButton () {
    this.setState({ visible: false })
  }
  onPressImageCard (index) {
    const theme = getTheme();    
      this.modalContent = (
      <View style={[theme.cardStyle, styles.popUpCard]}>
          <View style={theme.cardImageStyle}>
            <Image source={this.state.markers[index].image} style={styles.popUpImage} />
          </View>
          <TextInput style={theme.cardContentStyle} value={this.state.markers[index].title} />
          <TextInput style={theme.cardContentStyle} value={this.state.markers[index].description} />
          <Button onPress={this.onPressImageCard} title="EXIT" color="#841584" accessibilityLabel="exit" />
      </View>)

    this.setState({ visible: true })
  }



  render() {
    const interpolations = this.state.markers.map((marker, index) => {
      const inputRange = [
        (index - 1) * CARD_WIDTH,
        index * CARD_WIDTH,
        ((index + 1) * CARD_WIDTH),
      ];
      const scale = this.animation.interpolate({
        inputRange,
        outputRange: [1, 2.5, 1],
        extrapolate: "clamp",
      });
      const opacity = this.animation.interpolate({
        inputRange,
        outputRange: [0.35, 1, 0.35],
        extrapolate: "clamp",
      });
      return { scale, opacity };
    });

    return (
      <View style={styles.container}>
        <MapView
          ref={map => this.map = map}
          initialRegion={this.state.region}
          style={styles.container}
        >
          {this.state.markers.map((marker, index) => {
            return (
              <MapView.Marker key={index} coordinate={marker.coordinate}>
                <Animated.View style={[styles.markerWrap]}>
                  <Animated.View style={[styles.ring]} />
                  <View style={styles.marker} />
                </Animated.View>
              </MapView.Marker>
            );
          })}
        </MapView>
        <Animated.ScrollView
          horizontal
          scrollEventThrottle={1}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: {
                    x: this.animation,
                  },
                },
              },
            ],
            { useNativeDriver: true }
          )}
          style={styles.scrollView}
          contentContainerStyle={styles.endPadding}
        >
          {/* <Modal style={styles.popUpModal} visible={this.state.visible} transparent={true} animationType="slide" onRequestClose={() => this.setState({ visible:false })}>
            {this.modalContent}
          </Modal> */}
          {this.state.visible && this.modalContent}

        {this.state.markers.map((marker, index) => (
          <TouchableOpacity key={index} onPress={() =>this.onPressImageCard(index)}>
            <View style={styles.card} key={index} >
              <Image
                source={marker.image}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.textContent}>
                <Text numberOfLines={1} style={styles.cardtitle}>{marker.title}</Text>
                <Text numberOfLines={1} style={styles.cardDescription}>
                  {marker.description}
                </Text>
              </View>              
            </View>
          </TouchableOpacity>
        ))}
          
        </Animated.ScrollView>
      </View>
    );
  }
}

const theme = getTheme();

const mapStateToProps = state => ({
  markers: state.markers;
  
})

const mapDispatchToProps = dispatch => {
  const renderPhotos = 
}

export default connect(mapStateToProps, mapDispatchToProps)(MapScreen)