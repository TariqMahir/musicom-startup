import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from 'lib/firebase';
import L from 'leaflet';
import pinM from './PinMusicom.png';
import pinUser from './PinMusicomRed.png';
import pinMusicom from './pinMusicom2.png';
import axios from 'axios';
import {
  FormControl,
  FormLabel,
  Input,
  VStack,
  Button,
  Text,
  Stack,
  Center,
  HStack,
  Select,
  InputGroup,
  Box,
  useBreakpointValue,
  Link,
  InputLeftElement,
  Wrap,
  WrapItem,
  Badge,
  CloseButton,
  useColorModeValue,
  Heading,
  Flex,
} from '@chakra-ui/react';
import { Link as linkTo } from 'react-router-dom';
import { PROTECTED } from 'lib/routes';
import { BiMap } from 'react-icons/bi';
import Avatar from 'components/profile/Avatar';
import industries from 'lib/industries.json';
import UserCard from 'components/network/UserCard';
import { useAuth } from 'hooks/auth';

const PlacesAutocomplete = ({ location, setLocation, setSelectedLocation }) => {
  const [suggestions, setSuggestions] = useState([]);

  const handlePlaceSearch = async (value) => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${value}.json`,
        {
          params: {
            access_token:
              'pk.eyJ1IjoiYWxlbGVudGluaSIsImEiOiJjbGk5ZWF5MnQwOHl2M25wcXBjamd3NjQ4In0.MpcjArF0h_rXY6O3LdqjwA',
            types: 'place',
          },
        }
      );

      const features = response.data.features;
      setSuggestions(features);
    } catch (error) {
      console.log('Error fetching location suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (place) => {
    setLocation({
      name: place.place_name,
      center: place.center,
    });
    setSelectedLocation({
      latitude: place.center[1],
      longitude: place.center[0],
    });
    setSuggestions([]);
  };
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <FormControl>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <Box
            color="gray.300"
            display="flex"
            alignItems="center"
            mb={isMobile ? '3' : '0'}
          >
            <BiMap color="gray" h="5" w="5" />
          </Box>
        </InputLeftElement>
        <Input
          style={{ width: '100%' }}
          height={isMobile ? '7' : '10'}
          fontSize={{ base: 'xs', md: 'md' }}
          ml={{ base: -1, md: 0 }}
          placeholder="Insert your location (city)"
          value={location.name}
          onChange={(e) => {
            setLocation({ name: e.target.value });
            handlePlaceSearch(e.target.value);
          }}
        />
      </InputGroup>
      {suggestions.length > 0 && (
        <Wrap mt={2} spacing={2}>
          {suggestions.map((suggestion) => (
            <WrapItem key={suggestion.id}>
              <Badge
                colorScheme="blue"
                backgroundColor={'#6899fe'}
                color={'white'}
                cursor="pointer"
                fontSize={isMobile ? '2xs' : 'xs'}
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                {suggestion.place_name}
              </Badge>
            </WrapItem>
          ))}
        </Wrap>
      )}
    </FormControl>
  );
};

const Findr = () => {
  const [businesses, setBusinesses] = useState([]);
  const [location, setLocation] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [otherCategory, setOtherCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showPopup, setShowPopup] = useState(true);
  const { user } = useAuth();

  const [clickCount, setClickCount] = useState(user?.clickCount || 0);
  const [mapKey, setMapKey] = useState(0);
  const [subscribed, setSubscribed] = useState(null);

  const getActiveSubscription = async () => {
    try {
      const snapshot = await getDocs(
        query(
          collection(
            db,
            user?.businessName ? 'businesses' : 'users',
            user?.id,
            'subscriptions'
          ),
          where('status', 'in', ['trialing', 'active'])
        )
      );
      if (snapshot.docs.length > 0) {
        const doc = snapshot.docs[0];
        return doc.data().status;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting active subscription:', error);
      throw error;
    }
  };
  const [maxZoomLevel, setMaxZoomLevel] = useState(10); // default maxZoom level
  const handleZoomChange = () => {
    if (mapRef.current && mapRef.current.leafletElement) {
      const leafletMap = mapRef.current.leafletElement;

      const maxZoomLevel = user?.clickCount >= 2 ? (subscribed ? 17 : 10) : 17;

      leafletMap.setMaxZoom(maxZoomLevel);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getActiveSubscription();
        setSubscribed(data);
        const newMaxZoom = user?.clickCount > 1 ? (data ? 17 : 10) : 17;
        setMaxZoomLevel(newMaxZoom);

        // Now that we have the subscription data, we can use it in subsequent logic
        const userDocRef = doc(collection(db, 'users'), user?.id);

        const unsubscribe = onSnapshot(userDocRef, (doc) => {
          const userData = doc.data();
          setClickCount(userData?.clickCount || 0);
          setShowPopup(userData?.clickCount < 2 || data);

          if (userData?.clickCount > 1 && !data) {
            handleZoomChange();
            setMapKey((prevKey) => prevKey + 1);
          } else if (userData?.clickCount < 2 && !data) {
            handleZoomChange();
            setMapKey(0);
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [user?.id]);

  useEffect(() => {
    const updateZoomLevel = async () => {
      const newMaxZoom = user?.clickCount > 1 ? (subscribed ? 17 : 10) : 17;
      setMaxZoomLevel(newMaxZoom);
    };

    updateZoomLevel();
  }, [user?.clickCount]);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'businesses'));
        const data = querySnapshot.docs.map((doc) => doc.data());
        setBusinesses(data);
      } catch (error) {
        console.error('Error fetching businesses:', error);
      }
    };

    const fetchCategories = async () => {
      try {
        // Replace with your own logic to fetch business categories
        const categoriesData = industries.industryCategories;
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchBusinesses();
    fetchCategories();
  }, [user?.id]);
  const [mapCenter, setMapCenter] = useState([51.53942, -0.38337]); // default map center

  const handleMarkerClick = (userId, location) => {
    const userDocRef = doc(collection(db, 'users'), userId);
    setMapCenter([location.latitude, location.longitude]); // Update map center

    if (mapRef.current) {
      mapRef.current.setView([location.latitude, location.longitude], 10);
    }
    if (!subscribed) {
      // Check if the user is NOT subscribed
      if (clickCount >= 2) {
        // Check if the click limit is reached
        return; // Do nothing (prevent further clicks)
      }
    }

    // Increment click count without causing re-render
    setClickCount((prevCount) => {
      const newCount = prevCount + 1;

      // Check if the current month is different from the stored month
      const currentMonth = new Date().getMonth() + 1; // Get current month (1-based)
      const storedMonth = localStorage.getItem('currentMonth'); // Get stored month from localStorage

      if (currentMonth.toString() !== storedMonth) {
        // If the current month is different from the stored month
        localStorage.setItem('currentMonth', currentMonth.toString()); // Update stored month in localStorage
        return 1; // Reset the click count for the new month
      }

      return newCount; // Increment click count for the current month
    });

    // Update click count in Firestore
    updateDoc(userDocRef, {
      clickCount: clickCount + 1,
    }).catch((error) => {
      console.error('Error updating click count:', error);
    });
  };

  const getMarkerIcon = (businessName) => {
    return businessName ? pinMusicom : pinUser;
  };

  const customIcon = L.icon({
    iconUrl: pinMusicom,
    iconSize: [15, 25],
  });

  const customIconUser = L.icon({
    iconUrl: pinUser,
    iconSize: [38, 38],
  });

  const isMobile = useBreakpointValue({ base: true, md: false });

  const mapRef = useRef();

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const R = 6371; // Earth's radius in kilometers

    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  };

  const filteredBusinesses =
    selectedCategory !== 'other'
      ? businesses.filter((business) =>
          business.locations?.some((location) =>
            location?.Nature?.includes(selectedCategory)
          )
        )
      : otherCategory
      ? businesses.filter((business) =>
          business.locations?.some((location) =>
            location?.Nature?.includes(otherCategory)
          )
        )
      : businesses;

  const findClosestLocation = () => {
    let closestDistance = Infinity;
    let closestLocation = null;

    filteredBusinesses.forEach((business) => {
      business.locations?.Addresses?.some((location) => {
        const distance = calculateDistance(
          location.latitude,
          location.longitude
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestLocation = location;
        }
      });
    });

    return closestLocation;
  };

  useEffect(() => {
    if (
      location &&
      location.center &&
      location.center.length === 2 &&
      mapRef.current
    ) {
      const latitude = location.center[1];
      const longitude = location.center[0];
      if (latitude && longitude) {
        mapRef.current.setView([latitude, longitude], 10);
      }
    } else {
      const closestLocation = findClosestLocation();
      if (closestLocation && mapRef.current) {
        mapRef.current.setView(
          [closestLocation.latitude, closestLocation.longitude],
          8
        );
      } else if (mapRef.current) {
        mapRef.current.setView(mapCenter, 10);
      }
    }
  }, [location, filteredBusinesses]);

  return (
    <>
      {isMobile ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          mb={20}
          minHeight="60vh"
          //mb={20}
          width={'100%'}
        >
          <Box className="App" align="center" width="120%" pt={6}>
            <div
              style={{
                borderRadius: '8px',
                // border: "1px solid white",
                // boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                padding: '16px',
                width: '100%',
                marginBottom: '20px',
              }}
            >
              <Box
                border="1px solid white"
                backgroundColor="gray.200"
                width={24}
                margin="auto"
                pt={2}
              >
                <Text
                  style={{
                    marginBottom: '6px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: '#6899fe',
                  }}
                >
                  Findr
                </Text>
              </Box>
              <VStack spacing={4} direction="row" width="100%">
                <FormControl>
                  <FormLabel color={'#6899fe'}>Location</FormLabel>
                  <PlacesAutocomplete
                    location={location}
                    setLocation={setLocation}
                    setSelectedLocation={setSelectedLocation}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color={'#6899fe'}>Category</FormLabel>
                  <Select
                    placeholder="Select category"
                    size={isMobile ? 'xs' : ''}
                    fontSize={isMobile ? 'xs' : ''}
                    value={selectedCategory || (otherCategory ? 'other' : '')}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setOtherCategory('');
                    }}
                  >
                    {categories.map((category) => {
                      if (category !== 'HQ') {
                        return (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        );
                      }
                    })}
                    <option value="other">Other</option>
                  </Select>
                </FormControl>

                {selectedCategory === 'other' && (
                  <Input
                    placeholder="Other category"
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                  />
                )}
              </VStack>
              <HStack spacing={4} pt={2} direction="row" width="100%">
                <Stack
                  direction="row"
                  flex={1}
                  justifyContent="center"
                  pt={2}
                  alignItems="center"
                >
                  <Button
                    colorScheme="blue"
                    backgroundColor={'#6899fe'}
                    // variant="outline"
                    color={'white'}
                    onClick={() => {
                      setSelectedCategory('');
                      setOtherCategory('');
                      setLocation([]);
                      setSelectedLocation(null);
                    }}
                    size={isMobile ? 'sm' : 'md'}
                  >
                    Reset
                  </Button>
                </Stack>
              </HStack>
            </div>
          </Box>
          {user && (
            <MapContainer
              key={clickCount > 1 ? (subscribed ? 0 : 1) : 0}
              ref={mapRef}
              center={mapCenter} // Use state for dynamic center
              zoom={10}
              maxZoom={clickCount >= 1 ? (subscribed ? 17 : 10) : 17}
              style={{
                minHeight: '50vh',
                maxHeight: '100vh',
                minWidth: '120%',
              }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {filteredBusinesses.map((business) =>
                business.locations?.flatMap((address) =>
                  address?.Addresses?.map((location) => (
                    <Marker
                      key={business.businessName}
                      position={[location.latitude, location.longitude]}
                      icon={customIcon}
                      eventHandlers={{
                        click: () => {
                          handleMarkerClick(user?.id, location);
                        },
                      }}
                    >
                      {showPopup ? (
                        <Popup>
                          <Box py={0} w={'40'} minWidth={'20'} mr={-10} mb={-5}>
                            <Flex
                              width={'100%'}
                              minHeight={'50'}
                              height={'auto'}
                              bg={'white.900'}
                              rounded={'lg'}
                            >
                              {/* Avatar on the left */}
                              <Box p={6} ml={-10} mb={2}>
                                <Avatar
                                  size={'xs'}
                                  user={business}
                                  alt={'Avatar Alt'}
                                  mb={4}
                                  pos={'relative'}
                                />
                              </Box>

                              {/* Divider */}
                              <Box
                                borderRightWidth={1}
                                ml={-4}
                                mr={-4}
                                mb={3}
                                borderColor={'gray.700'}
                              />

                              {/* User information on the right */}
                              <Box p={6} mb={-10} mt={-7}>
                                {/* Full Name and Username */}
                                <Flex flexDirection={'row'} mb={3}>
                                  <Wrap spacing={1} mt={1}>
                                    <WrapItem>
                                      <Heading
                                        fontSize={'3xs'}
                                        fontFamily={'body'}
                                        as={Link}
                                        href={`${PROTECTED}/profile/${business.username}`}
                                      >
                                        {business.businessName}
                                      </Heading>
                                    </WrapItem>
                                    <Box
                                      borderRightWidth={1}
                                      ml={1}
                                      borderColor={'white.700'}
                                    />
                                    <WrapItem>
                                      <Text
                                        fontWeight={300}
                                        fontSize={'3xs'}
                                        as={Link}
                                        href={`${PROTECTED}/profile/${business.username}`}
                                        color={'gray.500'}
                                        mt={-0.5}
                                        ml={1}
                                      >
                                        @{business.username}
                                      </Text>
                                    </WrapItem>
                                  </Wrap>
                                </Flex>

                                <Wrap spacing={1} mt={-5} mb={5}>
                                  <WrapItem>
                                    <Text
                                      fontWeight={300}
                                      fontSize={'3xs'}
                                      color={'black.700'}
                                    >
                                      {location.address}
                                    </Text>
                                  </WrapItem>
                                </Wrap>
                              </Box>
                            </Flex>
                          </Box>
                        </Popup>
                      ) : (
                        <Popup>
                          <Box py={0} w={'40'} minWidth={'20'} mb={-10}>
                            <Flex
                              width={'100%'}
                              minHeight={'50'}
                              height={'auto'}
                              bg={'white.900'}
                              rounded={'lg'}
                            >
                              <Box mb={-10}>
                                <Wrap spacing={1} mt={-7} mb={5}>
                                  <WrapItem>
                                    <Text
                                      fontWeight={600}
                                      fontSize={'2xs'}
                                      color={'black.700'}
                                    >
                                      Your search limit for this month has been
                                      exceeded.
                                    </Text>
                                  </WrapItem>
                                </Wrap>
                              </Box>
                            </Flex>
                          </Box>
                        </Popup>
                      )}
                    </Marker>
                  ))
                )
              )}
              {/* {selectedLocation && (
              <Marker
                position={[
                  selectedLocation.latitude,
                  selectedLocation.longitude,
                ]}
                icon={customIconUser}
              >
                <Popup>
                  <strong>Selected Location</strong>
                </Popup>
              </Marker>
            )} */}
            </MapContainer>
          )}
          {!user && <Text>Error loading user, try reload the page</Text>}
        </Box>
      ) : (
        <Center>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minHeight="70vh"
            //mb={12}
            width={'80%'}
          >
            <Box className="App" align="center" width="60%" pt={6}>
              <div
                style={{
                  // borderRadius: "8px",
                  // border: "1px solid white",
                  // boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                  padding: '8px',
                  width: '100%',
                  marginBottom: '8px',
                }}
              >
                <Box
                  display="flex"
                  flex={1}
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  mx={0}
                >
                  <Text
                    mb={6}
                    fontWeight={'bold'}
                    fontSize={'22px'}
                    mt={3}
                    px={'10px'}
                    color={'#6899FE'}
                    backgroundColor={'#D9D9D9AB'}
                  >
                    Finder
                  </Text>
                </Box>
                <VStack spacing={4} direction="row" width="100%">
                  <FormControl>
                    <FormLabel color={'#6899fe'}>Location</FormLabel>
                    <PlacesAutocomplete
                      location={location}
                      setLocation={setLocation}
                      setSelectedLocation={setSelectedLocation}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel color={'#6899fe'}>Category</FormLabel>
                    <Select
                      placeholder="Select category"
                      value={selectedCategory || (otherCategory ? 'other' : '')}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map((category) => {
                        if (category !== 'HQ') {
                          return (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          );
                        }
                      })}
                      <option value="other">Other</option>
                    </Select>
                  </FormControl>
                  {selectedCategory === 'other' && (
                    <FormControl>
                      <FormLabel color={'#6899fe'}>Other Category</FormLabel>
                      <Input
                        placeholder="Other category"
                        value={otherCategory}
                        onChange={(e) => setOtherCategory(e.target.value)}
                      />
                    </FormControl>
                  )}
                </VStack>

                <HStack spacing={4} pt={1} direction="row" width="100%">
                  <Stack
                    direction="row"
                    flex={1}
                    justifyContent="center"
                    pt={1}
                    alignItems="center"
                  >
                    <Button
                      colorScheme="blue"
                      backgroundColor={'#6899fe'}
                      color={'white'}
                      // variant="outline"
                      onClick={() => {
                        setSelectedCategory('');
                        setOtherCategory('');
                        setLocation([]);
                        setSelectedLocation(null);
                      }}
                    >
                      Reset
                    </Button>
                  </Stack>
                </HStack>
              </div>
            </Box>
            {user && (
              <MapContainer
                key={clickCount > 1 ? (subscribed ? 0 : 1) : 0}
                ref={mapRef}
                center={mapCenter} // Use state for dynamic center
                zoom={10}
                maxZoom={clickCount >= 1 ? (subscribed ? 17 : 10) : 17}
                style={{
                  minHeight: '50vh',
                  maxHeight: '100vh',
                  minWidth: '100%',
                }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {filteredBusinesses.map((business) =>
                  business.locations?.flatMap((address) =>
                    address?.Addresses?.map((location) => (
                      <Marker
                        key={business.businessName}
                        position={[location.latitude, location.longitude]}
                        icon={customIcon}
                        eventHandlers={{
                          click: () => {
                            handleMarkerClick(user?.id, location);
                          },
                        }}
                      >
                        {showPopup ? (
                          <Popup>
                            <Center py={0} px={-3} w={'100%'} minWidth={'100'}>
                              <Flex
                                width={'100%'}
                                minHeight={'50'}
                                height={'auto'}
                                bg={'white.900'}
                                rounded={'lg'}
                              >
                                {/* Avatar on the left */}
                                <Box p={6} ml={-4} mr={2}>
                                  <Avatar
                                    size={'sm'}
                                    user={business}
                                    alt={'Avatar Alt'}
                                    mb={4}
                                    pos={'relative'}
                                  />
                                </Box>

                                {/* Divider */}
                                <Box
                                  borderRightWidth={1}
                                  ml={-4}
                                  mr={-4}
                                  borderColor={'gray.700'}
                                />

                                {/* User information on the right */}
                                <Box p={6} mb={-10} mt={-7}>
                                  {/* Full Name and Username */}
                                  <Flex flexDirection={'row'} mb={3}>
                                    <Wrap spacing={1} mt={1}>
                                      <WrapItem>
                                        <Text
                                          fontWeight={400}
                                          fontSize={{ base: '2xs', md: 'xs' }}
                                          fontFamily={'body'}
                                          as={Link}
                                          href={`${PROTECTED}/profile/${business.username}`}
                                        >
                                          {business.businessName}
                                        </Text>
                                      </WrapItem>
                                      <Box
                                        borderRightWidth={1}
                                        ml={1}
                                        borderColor={'white.700'}
                                      />
                                      <WrapItem>
                                        <Text
                                          fontWeight={400}
                                          fontSize={{ base: '2xs', md: 'xs' }}
                                          as={Link}
                                          href={`${PROTECTED}/profile/${business.username}`}
                                          color={'gray.500'}
                                          ml={1}
                                        >
                                          @{business.username}
                                        </Text>
                                      </WrapItem>
                                    </Wrap>
                                  </Flex>

                                  <Wrap spacing={1} mt={-5} mb={5}>
                                    <WrapItem>
                                      <Text
                                        fontWeight={400}
                                        fontSize={{ base: '2xs', md: 'xs' }}
                                        color={'black.700'}
                                      >
                                        {location.address}
                                      </Text>
                                    </WrapItem>
                                  </Wrap>
                                </Box>
                              </Flex>
                            </Center>
                          </Popup>
                        ) : (
                          <Popup>
                            <Box py={0} w={'40'} minWidth={'20'} mb={-10}>
                              <Flex
                                width={'100%'}
                                minHeight={'50'}
                                height={'auto'}
                                bg={'white.900'}
                                rounded={'lg'}
                              >
                                <Box mb={-10}>
                                  <Wrap spacing={1} mt={-7} mb={5}>
                                    <WrapItem>
                                      <Text
                                        fontWeight={600}
                                        fontSize={'2xs'}
                                        color={'black.700'}
                                      >
                                        Your search limit for this month has
                                        been exceeded.
                                      </Text>
                                    </WrapItem>
                                  </Wrap>
                                </Box>
                              </Flex>
                            </Box>
                          </Popup>
                        )}
                      </Marker>
                    ))
                  )
                )}

                {/* {selectedLocation && (
              <Marker
                position={[
                  selectedLocation.latitude,
                  selectedLocation.longitude,
                ]}
                icon={customIconUser}
              >
                <Popup>
                  <strong>Selected Location</strong>
                </Popup>
              </Marker>
            )} */}
              </MapContainer>
            )}
            {!user && <Text>Error loading user, try reload the page</Text>}
          </Box>
        </Center>
      )}
    </>
  );
};

export default Findr;
