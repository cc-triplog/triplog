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
import ViewOverflow from 'react-native-view-overflow';
import './styles'
import { WebBrowser, Component } from "expo";
import { getTheme } from 'react-native-material-kit';
import MapView from "react-native-maps";
import { MonoText } from "../components/StyledText";
import axios from 'axios';
import { connect } from 'react-redux';
import PopupCard from './PopupCard';
import { 
  renderPhotos, 
  changeCardVisibility, 
  selectImageCard,
  renderGPS
} from '../action';

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = height / 4;
const CARD_WIDTH = CARD_HEIGHT - 50;


class MapScreen extends React.Component {
  static navigationOptions = {
    header: null
  };
  constructor(props) {
    super(props);
  }


    componentWillMount = () => {
    this.index = 0;
    this.animation = new Animated.Value(0);
    this.callDatabasePhotos();
    this.callDatabaseGPS();
  }

  componentDidMount = () => {
    // We should detect when scrolling has stopped then animate
    // We should just debounce the event listener here
    this.animation.addListener(({ value }) => {
      let index = Math.floor(value / CARD_WIDTH + 0.3); // animate 30% away from landing on the next item
      if (index >= this.props.markers.length) {
        index = this.props.markers.length - 1;
      }
      if (index <= 0) {
        index = 0;
      }

      clearTimeout(this.regionTimeout);
      this.regionTimeout = setTimeout(() => {
        if (this.index !== index) {
          this.index = index;
          const { coordinate } = this.props.markers[index];
          this.map.animateToRegion(
            {
              ...coordinate,
              latitudeDelta: this.props.region.latitudeDelta,
              longitudeDelta: this.props.region.longitudeDelta,
            },
            350
          );
        }
      }, 10);
    });
  }

  callDatabaseGPS = async () => {
    await axios({
      url: 'http://ec2-54-199-164-132.ap-northeast-1.compute.amazonaws.com:4000/graphql',
      method: 'post',
      data: {
        query: `
        query {ReadGpsPoint(type: {
        }) {
         id,title,comment,latitude,longitude
        }
      }
        `
      }
    }).then(result => {
      const http = "http://"
      const gpsImage = "https://cdn4.iconfinder.com/data/icons/peppyicons/512/660011-location-512.png"
      let randomNumber = 487
      

      const mapResult = result.data.data.ReadGpsPoint.map(object => (
      {
        coordinate: {
          latitude: Number(object.latitude),
          longitude: Number(object.longitude),
        },
        title: 'RP GPS',
        description: 'GPS Points from Raspberry',
        image: { uri:`${gpsImage}` },
        id: object.id,
      }
    ));
      for(let i = 0; i < mapResult.length; i++) {
        randomNumber += 1
        mapResult[i].id = randomNumber
        this.props.renderGPS(mapResult[i])
      }
    }).catch(err => console.log("===========catch", err))
  }
  callDatabasePhotos = async () => {
    await axios({
      url: 'http://ec2-54-199-164-132.ap-northeast-1.compute.amazonaws.com:4000/graphql',
      method: 'post',
      data: {
        query: `
        query {ReadPhoto(type: {
        }) {
         title, latitude, longitude, comment, imageFile, id
        }
      }
        `
      }
    }).then(result => {
      const http = "http://"
      const mapResult = result.data.data.ReadPhoto.map(object => (
      {
        coordinate: {
          latitude: Number(object.latitude),
          longitude: Number(object.longitude),
        },
        title: `${object.title}`,
        description: `${object.comment}`,
        image: { uri: `${http + object.imageFile}` },
        id: object.id,
      }
    ));

      for(let i = 0; i < mapResult.length; i++) {
        this.props.renderPhotos(mapResult[i])
      }
    })
  }
  idToIndex = (id) => {
    let index;
    for(let i = 0; i < this.props.markers.length; i++) {
      if(this.props.markers[i].id === id) index = i
      this.props.selectImageCard(index)
    } 
  }
  onPressImageCard = (id) => {
    this.props.changeCardVisibility(true)
    this.idToIndex(id)
  }


  render() {
    const interpolations = this.props.markers.map((marker, index) => {
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
        {this.props.visible 
          ? <PopupCard /> 
          : <View />}
        <MapView
          ref={map => this.map = map}
          initialRegion={this.props.region}
          style={styles.container}
        >
          {this.props.markers.map((marker) => {
            return (
              <View pointerEvents='box-none' backgroundColor ='transparent'>
                <MapView.Marker key={marker.id} coordinate={marker.coordinate}>
                  <Animated.View style={[styles.markerWrap]}>
                    <Animated.View style={[styles.ring]} />
                    <View style={styles.marker} />
                  </Animated.View>
                </MapView.Marker>
              </View>
            );
          })}
          {this.props.GPS.map((GPS) => {
            return (
              <View pointerEvents='box-none' backgroundColor ='transparent'>
                <MapView.Marker key={GPS.id} coordinate={GPS.coordinate}>
                  <Animated.View style={[styles.markerWrap]}>
                    <Animated.View style={[styles.ring]} />
                    <View style={styles.marker} />
                  </Animated.View>
                </MapView.Marker>
              </View>
            )
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
        {this.props.markers.map((marker) => (
          <TouchableOpacity key={marker.id} onPress={() =>this.onPressImageCard(marker.id)}>
            <View style={styles.card}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  map: {
    height: 100,
    flex: 1
  },
  scrollView: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    paddingVertical: 10,
  },
  endPadding: {
    paddingRight: width - CARD_WIDTH,
  },
  card: {
    padding: 10,
    elevation: 2,
    backgroundColor: "#FFF",
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowRadius: 5,
    shadowOpacity: 0.3,
    shadowOffset: { x: 2, y: -2 },
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    overflow: "visible",
  },
  cardImage: {
    flex: 3,
    width: "100%",
    height: "100%",
    alignSelf: "center",
  },
  textContent: {
    flex: 1,
  },
  cardtitle: {
    fontSize: 12,
    marginTop: 5,
    fontWeight: "bold",
  },
  cardDescription: {
    fontSize: 12,
    color: "#444",
  },
  markerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(130,4,150, 0.9)",
  },
  ring: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(130,4,150, 0.3)",
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(130,4,150, 0.5)",
  },
})

const mapStateToProps = state => ({
  markers: state.markers,
  region: state.region,
  visible: state.visible,
  selectedImageIndex: state.selectedImageIndex,
  stateChanged: state.stateChanged
})

const mapDispatchToProps = dispatch => ({
  renderGPS: GPS => {
    const action = renderGPS(GPS);
    dispatch(action)
  }
  renderPhotos: photos => {
    const action = renderPhotos(photos);
    dispatch(action)
  },
  changeCardVisibility: visibility => {
    const action = changeCardVisibility(visibility)
    dispatch(action)
  },
  selectImageCard: index => {
    const action = selectImageCard(index)
    dispatch(action)
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(MapScreen)