import React, { useEffect, useState } from "react";
import {
  Box,
  Center,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Switch,
  FormControl,
  InputGroup,
  InputLeftElement,
  Input,
  Wrap,
  WrapItem,
  Badge,
  Button,
  useBreakpointValue,
} from "@chakra-ui/react";
import { MdOutlineRefresh } from "react-icons/md";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { useAuth } from "hooks/auth";
import { db } from "lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  where,
  updateDoc,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import logo from "Musicom Resources/Blue Logo Design/No Background/4x/Blue-White Icon Logo copy@4x.png"; // Import your logo image
import pinMusicom from "../findr/PinMusicom.png";
import pinUser from "../findr/PinMusicomRed.png";
import UserCard from "components/network/UserCard";
import axios from "axios";
import { BiMap } from "react-icons/bi";

const PlacesAutocomplete = ({ location, setLocation: setFormLocation }) => {
  const [suggestions, setSuggestions] = useState([]);

  const handlePlaceSearch = async (value) => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${value}.json`,
        {
          params: {
            access_token:
              "pk.eyJ1IjoiYWxlbGVudGluaSIsImEiOiJjbGk5ZWF5MnQwOHl2M25wcXBjamd3NjQ4In0.MpcjArF0h_rXY6O3LdqjwA",
            types: "place",
          },
        }
      );

      const features = response.data.features;
      const citySuggestions = features.map((feature) => feature.place_name);

      setSuggestions(citySuggestions);
    } catch (error) {
      console.log("Error fetching location suggestions:", error);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (value) => {
    setFormLocation(value);
    setSuggestions([]);
  };

  return (
    <FormControl>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <Box color="gray.300" display="flex" alignItems="center">
            <BiMap color="gray" h="6" w="6" />
          </Box>
        </InputLeftElement>
        <Input
          style={{ width: "100%" }}
          placeholder="Insert your location (city)"
          value={location}
          onChange={(e) => {
            setFormLocation(e.target.value);
            handlePlaceSearch(e.target.value);
          }}
        />
      </InputGroup>
      {suggestions.length > 0 && (
        <Wrap mt={2} spacing={2}>
          {suggestions.map((suggestion) => (
            <WrapItem key={suggestion}>
              <Badge
                colorScheme="blue"
                cursor="pointer"
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                {suggestion}
              </Badge>
            </WrapItem>
          ))}
        </Wrap>
      )}
    </FormControl>
  );
};

// Function to calculate distance between two coordinates using Haversine formula
const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in meters
  return distance;
};

const InStudio = () => {
  const { user, isLoading, error } = useAuth(); // Use the useAuth hook to get the authenticated user
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(1000); // radius in meters
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [inStudio, setInStudio] = useState(false);
  const [mapKey, setMapKey] = useState(Date.now()); // Unique key for MapContainer
  const [location, setLocation] = useState("");
  const [subscribed, setSubscribed] = useState(null);

  const getActiveSubscription = async () => {
    try {
      const snapshot = await getDocs(
        query(
          collection(
            db,
            user?.businessName ? "businesses" : "users",
            user?.id,
            "subscriptions"
          ),
          where("status", "in", ["trialing", "active"])
        )
      );
      if (snapshot.docs.length > 0) {
        const doc = snapshot.docs[0];
        return doc.data().status;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting active subscription:", error);
      throw error;
    }
  };
  useEffect(() => {
    if (user) {
      setInStudio(user?.inStudio);
    }
  }, [user]);

  const [showInStudio, setShowInStudio] = useState(false);
  useEffect(() => {
    if (user) {
      getActiveSubscription().then((status) => {
        setShowInStudio(status);
      });
    }
  }, [user]);

  const updateLocation = (latitude, longitude) => {
    setUserLocation([latitude, longitude]);
    setMapKey(Date.now());
    const userDocRef = doc(db, "users", user?.id);

    updateDoc(userDocRef, {
      lat: latitude,
      lng: longitude,
      inStudio: inStudio,
    })
      .then(() => {
        console.log("User document updated successfully.");
      })
      .catch((error) => {
        console.error("Error updating user document:", error);
      });
  };

  useEffect(() => {
    if (user && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation(latitude, longitude);

          const q = query(
            collection(db, "users"),
            where("inStudio", "==", true),
            where("username", "!=", user?.username)
          );
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const users = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              users.push({ id: doc.id, ...data });
            });
            setNearbyUsers(
              users.filter(
                (u) =>
                  getDistanceFromLatLonInMeters(
                    latitude,
                    longitude,
                    u.lat,
                    u.lng
                  ) <= radius
              )
            );
          });

          return () => unsubscribe();
        },
        (error) => {
          console.error("Error getting user's location:", error);
        }
      );
    }
  }, [user, inStudio]);

  const handleInStudioChange = async (event) => {
    setInStudio(event.target.checked);
    if (user) {
      const userDocRef = doc(db, "users", user?.id);
      await updateDoc(userDocRef, {
        inStudio: event.target.checked,
      });
    }
    setMapKey(Date.now());
  };

  const handleLocationSubmit = () => {
    if (location) {
      axios
        .get(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${location}.json`,
          {
            params: {
              access_token:
                "pk.eyJ1IjoiYWxlbGVudGluaSIsImEiOiJjbGk5ZWF5MnQwOHl2M25wcXBjamd3NjQ4In0.MpcjArF0h_rXY6O3LdqjwA",
              types: "place",
            },
          }
        )
        .then((response) => {
          const { center } = response.data.features[0];
          const [longitude, latitude] = center;
          updateLocation(latitude, longitude);
        })
        .catch((error) => {
          console.error("Error fetching location:", error);
        });
    }
  };

  const handleRefreshLocation = () => {
    setLocation("");
    setRadius(1000);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation(latitude, longitude);
        },
        (error) => {
          console.error("Error getting user's location:", error);
        }
      );
    }
  };
  const isMobile = useBreakpointValue({ base: true, md: false });

  const defaultIcon = L.icon({
    iconUrl: pinMusicom,
    iconSize: [15, 25],
  });

  const userIcon = L.icon({
    iconUrl: pinUser,
    iconSize: [38, 38],
  });

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  if (!user) {
    return <Text>Please log in to see the map.</Text>;
  }

  return (
    <Center>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="70vh"
        maxHeight={"100vh"}
        width={"80%"}
      >
        <Box
          className="App"
          align="center"
          width={isMobile ? "100%" : "60%"}
          pt={20}
        >
          <div
            style={{
              borderRadius: "8px",
              border: "1px solid white",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
              padding: "8px",
              width: "100%",
              marginBottom: "8px",
            }}
          >
            <Text
              style={{
                marginBottom: "6px",
                fontSize: "16px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              In Studio
            </Text>
            {showInStudio && (
              <Switch
                isChecked={inStudio}
                onChange={handleInStudioChange}
                colorScheme="teal"
                size="lg"
              >
                {inStudio ? "In Studio" : "Out of Studio"}
              </Switch>
            )}
            {inStudio && (
              <>
                <PlacesAutocomplete
                  location={location}
                  setLocation={setLocation}
                />
                <Button mt={4} onClick={handleLocationSubmit}>
                  Set Location
                </Button>
                <Button mt={4} ml={4} onClick={handleRefreshLocation}>
                  <MdOutlineRefresh />
                </Button>
              </>
            )}
            {userLocation ? (
              <div
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "8px",
                  marginTop: "20px",
                }}
              >
                <MapContainer
                  key={mapKey} // Use mapKey as key for MapContainer
                  center={userLocation}
                  zoom={12}
                  maxZoom={14}
                  style={{
                    height: !isMobile ? "400px" : "50vh",
                    width: !isMobile ? "100%" : "120%",
                    filter: inStudio ? "none" : "blur(5px)",
                  }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={userLocation} icon={defaultIcon}>
                    <Popup>You are here</Popup>
                  </Marker>
                  {inStudio &&
                    nearbyUsers?.map((user, idx) => (
                      <Marker
                        key={idx}
                        position={[user?.lat, user?.lng]}
                        icon={userIcon}
                      >
                        <Popup>Nearby user {idx + 1}</Popup>
                      </Marker>
                    ))}
                  <Circle center={userLocation} radius={radius} />
                </MapContainer>
                {!inStudio && (
                  <div
                    style={{
                      position: "absolute",
                      top: "0",
                      left: "0",
                      right: "0",
                      bottom: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255, 255, 255, 0.8)",
                      flexDirection: "column",
                    }}
                  >
                    <img
                      src={logo}
                      alt="Logo"
                      style={{ width: "150px", height: "150px" }}
                    />
                    {!showInStudio && (
                      <Text>Upgrate to Pro to use InStudio</Text>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Text>Loading map...</Text>
            )}
            {inStudio && (
              <Box mt={4} textAlign="center">
                <Text>Adjust Search Radius: {radius / 1000} km</Text>
                <Slider
                  defaultValue={1000}
                  min={1000}
                  max={100000}
                  step={100}
                  onChange={(val) => setRadius(val)}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </Box>
            )}
          </div>
        </Box>

        {inStudio && nearbyUsers.length > 0 && (
          <Box mt={4} width="100%">
            <Text fontSize="xl" fontWeight="bold" mb={2}>
              Nearby Users
            </Text>
            {nearbyUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </Box>
        )}
      </Box>
    </Center>
  );
};

export default InStudio;
