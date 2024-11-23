import React, { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  Input,
  VStack,
  Button,
  Icon,
  Select,
  Stack,
  Wrap,
  WrapItem,
  Center,
  Text,
  HStack,
  Badge,
  IconButton,
  InputGroup,
  Box,
  InputLeftElement,
  InputRightElement,
  useColorMode,
  useBreakpointValue,
  CloseButton,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from 'lib/firebase';
import UserCard from './UserCard';
import { FiRefreshCcw, FiX } from 'react-icons/fi';
import { BiMap, BiWorld } from 'react-icons/bi';
import { usePlacesWidget } from 'react-google-autocomplete';
import axios from 'axios';
import musicRoles from 'lib/musicRoles.json';
import musicRolesSuggestions from 'lib/musicRoleSuggestions.json';
import genresJSON from 'lib/genres.json';

function isMobileDevice() {
  const mobileWidthThreshold = 768;

  return window.innerWidth < mobileWidthThreshold;
}

const Autocomplete = ({
  location,
  setLocation,
  businessLocation,
  setBusinessLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handlePlaceSearch = async (value) => {
    setSearchQuery(value);

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
      const citySuggestions = features.map((feature) => ({
        address: feature.place_name,
        latitude: feature.center[1],
        longitude: feature.center[0],
      }));

      setSuggestions(citySuggestions);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (searchQuery.trim() !== '') {
        const newLocation = { address: searchQuery.trim() };
        setBusinessLocation((prevLocations) => [...prevLocations, newLocation]);
        setLocation((prevLocations) => [...prevLocations, newLocation]);
        setSearchQuery('');
      }
    }
  };

  const handleSelectSuggestion = (selectedSuggestion) => {
    setBusinessLocation((prevLocations) => [
      ...prevLocations,
      selectedSuggestion,
    ]);
    setLocation((prevLocations) => [...prevLocations, selectedSuggestion]);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleDeleteAddress = (address) => {
    setBusinessLocation((prevLocations) =>
      prevLocations.filter((loc) => loc.address !== address)
    );
    setLocation((prevLocations) =>
      prevLocations.filter((loc) => loc.address !== address)
    );
  };

  useEffect(() => {
    handlePlaceSearch(location?.address || '');
  }, [location]);

  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <FormControl>
      <InputGroup>
        <InputRightElement pointerEvents="none">
          <Box
            color="#6899fe"
            display="flex"
            alignItems="center"
            mb={isMobile ? '3' : '2'}
            mr={!isMobile ? '10px' : ''}
          >
            <BiMap color="gray" h="6" w="6" />
          </Box>
        </InputRightElement>
        <Input
          fontSize={isMobile ? '12px' : '15px'}
          height={isMobile ? '7' : '8'}
          width={isMobile ? '40rem' : '20rem'}
          placeholder="Insert your location"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handlePlaceSearch(e.target.value);
          }}
          onKeyDown={handleKeyDown}
        />
      </InputGroup>
      <VStack width={!isMobile ? '250px' : ''}>
        {suggestions.length > 0 && (
          <Wrap mt={2} spacing={2}>
            {suggestions.map((suggestion, index) => (
              <WrapItem key={suggestion.address + index}>
                <Badge
                  backgroundColor={'#6899FE'}
                  textColor={'white'}
                  fontWeight={500}
                  fontSize={'x-small'}
                  cursor="pointer"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion.address}
                </Badge>
              </WrapItem>
            ))}
          </Wrap>
        )}
        <Wrap mt={2} spacing={2}>
          {businessLocation &&
            businessLocation.map((location, index) => (
              <WrapItem
                key={location.address + index}
                justifyContent={'center'}
                flexDirection={'row'}
              >
                <Badge
                  backgroundColor={'#6899FE'}
                  textColor={'white'}
                  height={'20px'}
                  justifyContent={'center'}
                  alignContent={'center'}
                  fontWeight={500}
                  fontSize={'x-small'}
                >
                  <Flex flexDirection={'row'}>
                    {location.address}
                    <CloseButton
                      size="xs"
                      ml={2}
                      onClick={() => handleDeleteAddress(location.address)}
                    />
                  </Flex>
                </Badge>
              </WrapItem>
            ))}
        </Wrap>
      </VStack>
    </FormControl>
  );
};

const NetworkPage = () => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [instrument, setInstrument] = useState('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState([]);
  const [businessLocation, setBusinessLocation] = useState('');
  const [signed, setSigned] = useState('');
  const [languages, setLanguages] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [instrumentSuggestions, setInstrumentSuggestions] = useState([]);
  const [genreSuggestions, setGenreSuggestions] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [genres, setGenres] = useState([]);
  const [genre, setGenre] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [usersPerPage, setUsersPerPage] = useState(10); // State to track the number of users per page

  const handleFilter = async () => {
    setLoading(true);

    const usersRef = collection(db, 'users');

    let filteredQuery = query(usersRef);

    if (username) {
      filteredQuery = query(filteredQuery, where('username', '==', username));
    }

    if (role !== 'Other' && role && !otherRole) {
      filteredQuery = query(filteredQuery, where('role', '==', role));
    }

    if (role === 'Other' && otherRole) {
      filteredQuery = query(filteredQuery, where('role', '==', otherRole));
    }

    if (gender) {
      filteredQuery = query(filteredQuery, where('gender', '==', gender));
    }

    if (genres.length > 0) {
      filteredQuery = query(
        filteredQuery,
        where('genre', 'array-contains-any', genres)
      );
    }

    if (signed) {
      filteredQuery = query(filteredQuery, where('signed', '==', signed));
    }

    if (selectedLanguages.length > 0) {
      filteredQuery = query(
        filteredQuery,
        where('languages', 'array-contains-any', selectedLanguages)
      );
    }

    try {
      const usersSnapshot = await getDocs(filteredQuery);

      let users = usersSnapshot.docs.map((doc) => doc.data());

      if (instruments.length > 0) {
        const userSnapshot = await getDocs(filteredQuery);
        users = userSnapshot.docs.map((doc) => doc.data());

        users = users.filter((user) => {
          return instruments.some((instrument) =>
            user.instrument.includes(instrument)
          );
        });
      } else {
        const userSnapshot = await getDocs(filteredQuery);
        users = userSnapshot.docs.map((doc) => doc.data());
      }

      if (location && location.length > 0) {
        const cityArray = location.map((place) => ({
          firstPart: place.address.split(',')[0].trim(),
          secondPart: place.address.split(',')[1].trim(),
        }));

        // Filtering Users based on Location
        users = users.filter((user) =>
          cityArray.some(
            (city) =>
              user.location.includes(city.firstPart) ||
              user.location.includes(city.secondPart)
          )
        );
      }
      const combinedData = [];
      if (
        role == '' &&
        instruments.length < 1 &&
        gender == '' &&
        signed == ''
      ) {
        combinedData.push(...users);
      } else {
        combinedData.push(...users);
      }
      setFilteredUsers(combinedData);
      setCurrentPage(0); // Reset to the first page after filtering
    } catch (error) {
      console.log('Error filtering users:', error);
    }

    setLoading(false);
  };

  const fetchInstrumentSuggestions = async (value) => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(query(usersRef));
      const users = querySnapshot.docs.map((doc) => doc.data());

      const matchedInstruments = new Set();

      users.map((user) => {
        user?.instrument.map((instrument) => {
          if (instrument.toLowerCase().includes(value.toLowerCase())) {
            matchedInstruments.add(instrument);
          }
        });
      });

      setInstrumentSuggestions(Array.from(matchedInstruments));
    } catch (error) {
      console.log('Error fetching instrument suggestions:', error);
      setInstrumentSuggestions([]);
    }
  };

  const fetchGenreSuggestions = async (value) => {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(query(usersRef));
      const users = querySnapshot.docs.map((doc) => doc.data());

      const matchedGenresFromFirestore = new Set();

      users.forEach((user) => {
        user.genres.forEach((genre) => {
          if (genre.toLowerCase().includes(value.toLowerCase())) {
            matchedGenresFromFirestore.add(genre);
          }
        });
      });

      // Fetch genre suggestions from Firestore
      const firestoreSuggestions = Array.from(matchedGenresFromFirestore);

      // Filter genre suggestions from JSON file
      const matchedGenresFromJSON = genresJSON.filter((g) =>
        g.toLowerCase().includes(value.toLowerCase())
      );

      // Combine the suggestions from Firestore and JSON
      const combinedSuggestions = [
        ...firestoreSuggestions,
        ...matchedGenresFromJSON,
      ];

      setGenreSuggestions(combinedSuggestions);
    } catch (error) {
      // Handle errors, e.g., by only using JSON suggestions
      const matchedGenres = genresJSON.filter((g) =>
        g.toLowerCase().includes(value.toLowerCase())
      );
      setGenreSuggestions(matchedGenres);
      console.log('Error fetching genres suggestions:', error);
    }
  };

  const handleInstrumentChange = (e) => {
    const value = e.target.value;
    setInstrument(value);

    if (value.length >= 2) {
      fetchInstrumentSuggestions(value);
    } else {
      setInstrumentSuggestions([]);
    }
  };

  const handleGenreChange = (e) => {
    const value = e.target.value;
    setGenre(value);

    if (value.length >= 2) {
      fetchGenreSuggestions(value);
    } else {
      setGenreSuggestions([]);
    }
  };

  const handleInsertInstrument = (e) => {
    if (e.key === 'Enter' && instrument.trim() !== '') {
      e.preventDefault();
      setInstruments((prevInstruments) => [
        ...prevInstruments,
        instrument.trim(),
      ]);
      setInstrument(''); // Clear the instrument input field
      setInstrumentSuggestions([]); // Clear the instrument suggestions
    }
  };

  const handleInsertGenre = (e) => {
    if (e.key === 'Enter' && genre.trim() !== '') {
      e.preventDefault();
      setGenres((prevGenres) => [...prevGenres, genre.trim()]);
      setGenre(''); // Clear the genre input field
      setGenreSuggestions([]); // Clear the genre suggestions
    }
  };

  const handleSelectGenre = (genre) => {
    setGenres((prevGenres) => [...prevGenres, genre]);
    setGenre(''); // Clear the genre input field
    setGenreSuggestions([]); // Clear the genre suggestions
  };

  const handleSelectInstrument = (instrument) => {
    setInstruments((prevInstruments) => [...prevInstruments, instrument]);
    setInstrument(''); // Clear the instrument input field
    setInstrumentSuggestions([]); // Clear the instrument suggestions
  };

  const handleRemoveInstrument = (instrument) => {
    setInstruments((prevInstruments) =>
      prevInstruments.filter((item) => item !== instrument)
    );
  };

  const handleRemoveGenre = (genre) => {
    setGenres((prevGenres) => prevGenres.filter((item) => item !== genre));
  };

  const resetForm = () => {
    setUsername('');
    setRole('');
    setInstrument('');
    setInstruments([]);
    setGenres([]);
    setGenre('');
    setGender('');
    setLocation('');
    setBusinessLocation('');
    setSigned('');
    setFilteredUsers([]);
    setSelectedLanguage([]);
    setSelectedLanguages([]);
    instruments.map((instrument) => handleRemoveInstrument(instrument));
  };

  const isMobile = useBreakpointValue({ base: true, md: false });

  const fetchLanguages = async () => {
    try {
      const response = await axios.get('https://restcountries.com/v2/all');
      const countries = response.data;
      const languages = countries.reduce((allLanguages, country) => {
        const countryLanguages = country.languages.map((language) => ({
          value: language.name,
          label: language.name,
        }));
        return [...allLanguages, ...countryLanguages];
      }, []);
      return languages;
    } catch (error) {
      console.error('Error fetching language data:', error);
      return [];
    }
  };

  const uniqueLanguages = new Set(
    languages.map((language) => {
      return language.value;
    })
  );

  const sortedLanguages = Array.from(uniqueLanguages).sort();

  const [languageOptions, setLanguageOptions] = useState([]);

  useEffect(() => {
    const fetchLanguageOptions = async () => {
      const languagess = await fetchLanguages();
      setLanguageOptions(languagess);
      setLanguages(languagess);
    };

    fetchLanguageOptions();
  }, []);

  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState([]);

  const handleAddLanguage = () => {
    setSelectedLanguages((prevLanguages) => [
      ...prevLanguages,
      selectedLanguage,
    ]);
    setSelectedLanguage([]); // Clear the instrument input field
  };

  const handleRemoveLanguage = (language) => {
    const updatedLanguages = selectedLanguages.filter(
      (lang) => lang !== language
    );
    setSelectedLanguages(updatedLanguages);
  };

  const roles = musicRoles.categorymembers.map((item) => item.title);
  const suggestedRoles = musicRolesSuggestions.categorymembers.map(
    (item) => item.title
  );

  const [filteredRoles, setFilteredRoles] = useState(roles);

  const [searchValue, setSearchValue] = useState('');
  const [showOtherTextField, setShowOtherTextField] = useState(false);
  const [otherRole, setOtherRole] = useState('');
  const [value, setValue] = useState('');

  const { colorMode, setColorMode } = useColorMode();

  const [otherRoleSuggestions, setOtherRoleSuggestions] = useState([]);
  const [selectedOtherRoles, setSelectedOtherRoles] = useState([]);

  const fetchOtherRoleSuggestions = (value) => {
    const matchedSuggestions = musicRolesSuggestions.categorymembers.filter(
      (role) => role.title.toLowerCase().includes(value.toLowerCase())
    );
    setOtherRoleSuggestions(matchedSuggestions);
  };

  const handleRoleSelectChange = (event) => {
    const { value } = event.target;
    if (value === 'Other') {
      setShowOtherTextField(true);
    } else {
      setShowOtherTextField(false);
      setOtherRole('');
    }
    setRole(value);
  };

  const handleOtherRoleChange = (event) => {
    const { value } = event.target;
    setOtherRole(value);

    if (value.length >= 2) {
      fetchOtherRoleSuggestions(value);
    } else {
      setOtherRoleSuggestions([]);
    }
  };

  const handleRemoveRole = (role) => {
    setSelectedOtherRoles((prevRoles) =>
      prevRoles.filter((item) => item !== role)
    );
  };

  const handleInsertRole = (event) => {
    if (event.key === 'Enter' && otherRole.trim() !== '') {
      event.preventDefault();
      setSelectedOtherRoles((prevRoles) => [...prevRoles, otherRole.trim()]);
      setOtherRole(''); // Clear the role input field
    }
  };

  const displayedUsers = filteredUsers.slice(
    currentPage * usersPerPage,
    (currentPage + 1) * usersPerPage
  );

  return (
    <Center>
      {!isMobile ? (
        <VStack
          borderRightWidth="1px"
          borderLeftWidth="1px"
          borderColor="gray.300"
          p={0}
          rounded="md" // Optional: adds rounded corners
          spacing={4}
          width="1000px"
        >
          <Box
            display={'flex'}
            justifyContent={'center'}
            alignContent={'center'}
          >
            <HStack
              spacing={4}
              align="center"
              width={{ md: '60%' }}
              pt="10"
              justifyContent={'center'}
              alignItems={'center'}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleFilter();
                }}
                style={{
                  borderRadius: '8px',
                  padding: '5px',
                  width: '100%',
                }}
              >
                <Flex direction={'row'}>
                  <Flex flex={1} />
                  <Text
                    mb={6}
                    fontWeight={'bold'}
                    fontSize={'22px'}
                    mt={-0.5}
                    px={'10px'}
                    color={'#6899FE'}
                    backgroundColor={'#D9D9D9AB'}
                  >
                    Network
                  </Text>
                  <Flex flex={1} />
                </Flex>
                <HStack
                  gap={'10rem'}
                  justifyContent={'center'}
                  alignItems={'flex-start'}
                  mb={'1rem'}
                >
                  <VStack>
                    <FormControl flex={1}>
                      <FormLabel
                        fontSize={'15px'}
                        textAlign={'center'}
                        color={'#6899FE'}
                      >
                        Username
                      </FormLabel>
                      <Input
                        fontSize={'15px'}
                        value={username}
                        height={isMobile ? '7' : '8'}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        width={'20rem'}
                      />
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel
                        fontSize={'15px'}
                        textAlign={'center'}
                        color={'#6899FE'}
                      >
                        Role
                      </FormLabel>
                      <Select
                        fontSize={'15px'}
                        value={role}
                        height={'8'}
                        width={'20rem'}
                        onChange={(e) => {
                          handleRoleSelectChange(e);
                          setRole(e.target.value);
                        }}
                        placeholder="Select role"
                      >
                        {roles.map((rol) => (
                          <option
                            key={rol}
                            disabled={
                              rol === 'PROFESSIONAL' ||
                              rol === 'CREATIVE' ||
                              rol === 'BUSINESS'
                            }
                          >
                            {rol}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <Stack flexDirection={'column'}>
                      {showOtherTextField && (
                        <FormControl flex={1}>
                          <FormLabel
                            fontSize={'15px'}
                            textAlign={'center'}
                            color={'#6899FE'}
                          >
                            Other Role
                          </FormLabel>
                          <Input
                            fontSize={'15px'}
                            value={otherRole}
                            onChange={handleOtherRoleChange}
                            onKeyDown={handleInsertRole}
                            placeholder="Enter other role"
                            width={'20rem'}
                          />
                        </FormControl>
                      )}
                      {otherRoleSuggestions.length > 0 && (
                        <Wrap mt={2} spacing={2}>
                          {otherRoleSuggestions.map((suggestion, index) => (
                            <WrapItem key={suggestion + index}>
                              <Badge
                                fontSize={isMobile ? '2xs' : 'xs'}
                                colorScheme="blue"
                                cursor="pointer"
                                onClick={() => setOtherRole(suggestion.title)}
                              >
                                {suggestion.title}
                              </Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      )}

                      <Wrap>
                        {selectedOtherRoles.map((role, index) => (
                          <WrapItem key={role + index}>
                            <Badge
                              variant="subtle"
                              colorScheme="blue"
                              fontSize="sm"
                            >
                              {role}
                              <IconButton
                                icon={<Icon as={FiRefreshCcw} />}
                                size={isMobile ? '2xs' : 'xs'}
                                ml="1"
                                onClick={() => handleRemoveRole(role)}
                                aria-label="Remove Role"
                              />
                            </Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Stack>
                    <FormControl flex={1}>
                      <FormLabel
                        fontSize={'15px'}
                        textAlign={'center'}
                        color={'#6899FE'}
                      >
                        Instruments
                      </FormLabel>
                      <InputGroup>
                        <Input
                          fontSize={'15px'}
                          value={instrument}
                          onChange={handleInstrumentChange}
                          onKeyDown={handleInsertInstrument}
                          height={'8'}
                          placeholder="Enter instrument"
                          width={'20rem'}
                        />
                      </InputGroup>
                      {instrumentSuggestions.length > 0 && (
                        <Wrap mt={2} spacing={2}>
                          {instrumentSuggestions.map((suggestion) => (
                            <WrapItem key={suggestion}>
                              <Badge
                                variant="subtle"
                                backgroundColor="#6899FE"
                                textColor={'white'}
                                fontSize={'xs'}
                                onClick={() =>
                                  handleSelectInstrument(suggestion)
                                }
                              >
                                {suggestion}
                              </Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      )}
                      <Wrap mt={2} mb={1}>
                        {instruments.map((instrument) => (
                          <WrapItem key={instrument}>
                            <Badge
                              variant="subtle"
                              backgroundColor="#6899FE"
                              textColor={'white'}
                              border={10}
                              fontWeight={500}
                              fontSize={isMobile ? '2xs' : 'xs'}
                            >
                              {instrument}
                              <IconButton
                                icon={<Icon as={FiX} />}
                                size={isMobile ? '2xs' : 'xs'}
                                ml="0.5"
                                backgroundColor={'transparent'}
                                color={'white'}
                                onClick={() =>
                                  handleRemoveInstrument(instrument)
                                }
                                aria-label="Remove Instrument"
                              />
                            </Badge>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </FormControl>
                    <FormControl flex={1} width="100%">
                      <FormLabel
                        fontSize={isMobile ? '12px' : '15px'}
                        textAlign={'center'}
                        color={'#6899FE'}
                      >
                        Gender
                      </FormLabel>
                      <Select
                        fontSize={isMobile ? '12px' : '15px'}
                        value={gender}
                        height={isMobile ? '7' : '8'}
                        onChange={(e) => setGender(e.target.value)}
                        placeholder="Select gender"
                        width={'20rem'}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Select>
                    </FormControl>
                  </VStack>
                  <VStack>
                    <FormControl flex={1} width="100%">
                      <FormLabel
                        fontSize={isMobile ? '12px' : '15px'}
                        textAlign={'center'}
                        color={'#6899FE'}
                      >
                        Signed
                      </FormLabel>
                      <Select
                        fontSize={isMobile ? '12px' : '15px'}
                        value={signed}
                        height={isMobile ? '7' : '8'}
                        onChange={(e) => setSigned(e.target.value)}
                        placeholder="Select signed"
                        width={'20rem'}
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </Select>
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel
                        fontSize={'15px'}
                        textAlign={'center'}
                        color={'#6899FE'}
                      >
                        Genres
                      </FormLabel>
                      <InputGroup>
                        <Input
                          fontSize={'15px'}
                          value={genre}
                          onChange={handleGenreChange}
                          onKeyDown={handleInsertGenre}
                          height={'8'}
                          width={'20rem'}
                          placeholder="Enter genre"
                        />
                      </InputGroup>
                      <VStack width={'250px'}>
                        {genreSuggestions.length > 0 && (
                          <Wrap mt={1}>
                            {genreSuggestions.map((suggestion) => (
                              <WrapItem key={suggestion}>
                                <Badge
                                  backgroundColor={'#6899FE'}
                                  textColor={'white'}
                                  fontWeight={500}
                                  fontSize={'xs'}
                                  cursor="pointer"
                                  onClick={() => handleSelectGenre(suggestion)}
                                >
                                  {suggestion}
                                </Badge>
                              </WrapItem>
                            ))}
                          </Wrap>
                        )}
                        <Wrap mt={1}>
                          {genres.map((genre) => (
                            <WrapItem key={genre}>
                              <Badge
                                variant="subtle"
                                backgroundColor={'#6899FE'}
                                textColor={'white'}
                                fontWeight={500}
                                fontSize={'xs'}
                              >
                                {genre}
                                <IconButton
                                  icon={<Icon as={FiX} />}
                                  size={'xs'}
                                  backgroundColor={'transparent'}
                                  color={'white'}
                                  ml="1"
                                  onClick={() => handleRemoveGenre(genre)}
                                  aria-label="Remove Instrument"
                                />
                              </Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      </VStack>
                    </FormControl>
                    <FormControl flex={1} textAlign={'center'}>
                      <FormLabel
                        fontSize={'15px'}
                        textAlign={'center'}
                        color={'#6899FE'}
                      >
                        Location
                      </FormLabel>
                      <Autocomplete
                        location={location}
                        setLocation={setLocation}
                        businessLocation={businessLocation}
                        setBusinessLocation={setBusinessLocation}
                      />
                    </FormControl>
                    <FormControl flex={1}>
                      <FormLabel
                        fontSize={'15px'}
                        textAlign={'center'}
                        textColor={'#6899FE'}
                      >
                        Languages
                      </FormLabel>
                      <InputGroup>
                        <Select
                          placeholder="Select your language"
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          fontSize={'15px'}
                          height={'8'}
                          width={'17.5rem'}
                        >
                          {sortedLanguages.map((language, index) => (
                            <option key={language + index} value={language}>
                              {language}
                            </option>
                          ))}
                        </Select>
                        <Button
                          size="sm"
                          backgroundColor={'#6899FE'}
                          color="#fff"
                          ml={1}
                          onClick={() => handleAddLanguage(selectedLanguage)}
                        >
                          +
                        </Button>
                      </InputGroup>
                      <Flex direction="row" mt="2" flexWrap="wrap">
                        {selectedLanguages.map((language, index) => (
                          <Box
                            key={language + index}
                            mr={2}
                            mt={2}
                            position="relative"
                          >
                            <Flex alignItems="center">
                              <Badge
                                variant="solid"
                                colorScheme={'white'}
                                textColor="black"
                                fontSize={12}
                                fontWeight={400}
                                border={'0.3px solid black'}
                                borderRadius="md"
                                px="2"
                                py="1"
                                display="inline-flex"
                                alignContent={'center'}
                                alignItems="center"
                              >
                                {language}
                                <CloseButton
                                  height={3}
                                  width={3}
                                  ml={2}
                                  onClick={() => handleRemoveLanguage(language)}
                                />
                              </Badge>
                            </Flex>
                          </Box>
                        ))}
                      </Flex>
                    </FormControl>
                  </VStack>
                </HStack>
                <HStack spacing={4} pt={2} direction={'row'} width="100%">
                  <Stack
                    direction="row"
                    flex={1}
                    justifyContent="center"
                    pt={8}
                    alignItems="center"
                  >
                    <Button
                      type="submit"
                      isLoading={loading}
                      size={'md'}
                      width={'100px'}
                      backgroundColor={'#6899FE'}
                      color={'#fff'}
                    >
                      Search
                    </Button>
                    <Button
                      onClick={() => {
                        resetForm();
                      }}
                      backgroundColor={'#6899FE'}
                      color={'#fff'}
                      size={'md'}
                      width={'100px'}
                      variant="outline"
                    >
                      Reset
                    </Button>
                    {displayedUsers.length > 0 && (
                      <Select
                        width={'100px'}
                        value={usersPerPage}
                        onChange={(e) =>
                          setUsersPerPage(Number(e.target.value))
                        }
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </Select>
                    )}
                  </Stack>
                </HStack>
              </form>
            </HStack>
          </Box>

          <Stack width="100%" mt={'10px'} mb={'30px'}>
            {displayedUsers.length > 0 ? (
              <Wrap p={4}>
                <Divider
                  borderColor="gray.300"
                  width="90%"
                  m={3}
                  borderWidth="0.5px"
                />
                {displayedUsers.map((user) => (
                  <WrapItem key={user.id} width={'49%'}>
                    <UserCard user={user} isNetwork={true} />
                  </WrapItem>
                ))}
              </Wrap>
            ) : (
              <></>
            )}
          </Stack>
          <HStack mb={5}>
            {currentPage > 0 && displayedUsers.length > 0 && (
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                backgroundColor={'#6899FE'}
                color={'#fff'}
                width={'100px'}
              >
                Back
              </Button>
            )}
            {filteredUsers.length > usersPerPage * (currentPage + 1) && (
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                backgroundColor={'#6899FE'}
                color={'#fff'}
                width={'100px'}
              >
                Next
              </Button>
            )}
          </HStack>
        </VStack>
      ) : (
        <VStack spacing={4} align="center" width={{ base: '100%' }} pt="10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFilter();
            }}
            style={{
              borderRadius: '8px',
              padding: '5px',
              width: '100%',
            }}
          >
            <Flex direction={'row'}>
              <Flex flex={1} />
              <Text
                style={{
                  marginBottom: '16px',
                  fontWeight: 'bold',
                  color: '#6899FE',
                }}
                fontSize={'3xl'}
                mt={2.5}
                paddingRight={4}
                paddingLeft={4}
                bgColor={'#E2E8F0'}
              >
                Network
              </Text>
              <Flex flex={1} />
            </Flex>
            <Stack direction={{ base: 'column' }} width="100%">
              <FormControl flex={1}>
                <FormLabel
                  fontSize={'12px'}
                  textAlign={'center'}
                  color={'#6899FE'}
                >
                  Username
                </FormLabel>
                <Input
                  fontSize={'12px'}
                  value={username}
                  height={'7'}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                />
              </FormControl>
              <FormControl flex={1}>
                <FormLabel
                  fontSize={'12px'}
                  textAlign={'center'}
                  color={'#6899FE'}
                >
                  Role
                </FormLabel>
                <Select
                  fontSize={'12px'}
                  value={role}
                  height={'7'}
                  onChange={(e) => {
                    handleRoleSelectChange(e);
                    setRole(e.target.value);
                  }}
                  placeholder="Select role"
                >
                  {roles.map((rol) => (
                    <option
                      key={rol}
                      disabled={
                        rol === 'PROFESSIONAL' ||
                        rol === 'CREATIVE' ||
                        rol === 'BUSINESS'
                      }
                    >
                      {rol}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <Stack flexDirection={'column'}>
                {showOtherTextField && (
                  <FormControl flex={1}>
                    <FormLabel
                      fontSize={'12px'}
                      textAlign={'center'}
                      color={'#6899FE'}
                    >
                      Other Role
                    </FormLabel>
                    <Input
                      fontSize={'12px'}
                      value={otherRole}
                      onChange={handleOtherRoleChange}
                      onKeyDown={handleInsertRole}
                      placeholder="Enter other role"
                    />
                  </FormControl>
                )}
                {otherRoleSuggestions.length > 0 && (
                  <Wrap mt={2} spacing={2}>
                    {otherRoleSuggestions.map((suggestion, index) => (
                      <WrapItem key={suggestion + index}>
                        <Badge
                          fontSize={'2xs'}
                          colorScheme="blue"
                          cursor="pointer"
                          onClick={() => setOtherRole(suggestion.title)}
                        >
                          {suggestion.title}
                        </Badge>
                      </WrapItem>
                    ))}
                  </Wrap>
                )}

                <Wrap>
                  {selectedOtherRoles.map((role, index) => (
                    <WrapItem key={role + index}>
                      <Badge variant="subtle" colorScheme="blue" fontSize="sm">
                        {role}
                        <IconButton
                          icon={<Icon as={FiRefreshCcw} />}
                          size={'2xs'}
                          ml="1"
                          onClick={() => handleRemoveRole(role)}
                          aria-label="Remove Role"
                        />
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
              </Stack>
              <FormControl flex={1}>
                <FormLabel
                  fontSize={'12px'}
                  textAlign={'center'}
                  color={'#6899FE'}
                >
                  Instruments
                </FormLabel>
                <InputGroup>
                  <Input
                    fontSize={'12px'}
                    value={instrument}
                    onChange={handleInstrumentChange}
                    onKeyDown={handleInsertInstrument}
                    height={'7'}
                    placeholder="Enter instrument"
                  />
                </InputGroup>
                {instrumentSuggestions.length > 0 && (
                  <Wrap mt={2} spacing={2}>
                    {instrumentSuggestions.map((suggestion) => (
                      <WrapItem key={suggestion}>
                        <Badge
                          variant="subtle"
                          backgroundColor="#6899FE"
                          textColor={'white'}
                          fontSize={'2xs'}
                          onClick={() => handleSelectInstrument(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      </WrapItem>
                    ))}
                  </Wrap>
                )}
                <Wrap mt={2} mb={1}>
                  {instruments.map((instrument) => (
                    <WrapItem key={instrument}>
                      <Badge
                        variant="subtle"
                        backgroundColor="#6899FE"
                        textColor={'white'}
                        fontSize={'2xs'}
                      >
                        {instrument}
                        <IconButton
                          icon={<Icon as={FiRefreshCcw} />}
                          size={'2xs'}
                          ml="3"
                          onClick={() => handleRemoveInstrument(instrument)}
                          aria-label="Remove Instrument"
                        />
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
              </FormControl>
            </Stack>
            <Stack
              spacing={4}
              pt="2"
              direction={{ base: 'column' }}
              width="100%"
            >
              <VStack padding="2px">
                <FormControl flex={1} width="100%">
                  <FormLabel
                    fontSize={'12px'}
                    textAlign={'center'}
                    color={'#6899FE'}
                  >
                    Gender
                  </FormLabel>
                  <Select
                    fontSize={'12px'}
                    value={gender}
                    height={'7'}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder="Select gender"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Select>
                </FormControl>
                <FormControl flex={1} width="100%">
                  <FormLabel
                    fontSize={'12px'}
                    textAlign={'center'}
                    color={'#6899FE'}
                  >
                    Signed
                  </FormLabel>
                  <Select
                    fontSize={'12px'}
                    value={signed}
                    height={'7'}
                    onChange={(e) => setSigned(e.target.value)}
                    placeholder="Select signed"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </Select>
                </FormControl>
              </VStack>
              <FormControl flex={1}>
                <FormLabel
                  fontSize={'12px'}
                  textAlign={'center'}
                  color={'#6899FE'}
                >
                  Genres
                </FormLabel>
                <InputGroup>
                  <Input
                    fontSize={'12px'}
                    value={genre}
                    onChange={handleGenreChange}
                    onKeyDown={handleInsertGenre}
                    height={'7'}
                    placeholder="Enter genre"
                  />
                </InputGroup>
                {genreSuggestions.length > 0 && (
                  <Wrap>
                    {genreSuggestions.map((suggestion) => (
                      <WrapItem key={suggestion}>
                        <Badge
                          colorScheme="blue"
                          cursor="pointer"
                          fontSize={'2xs'}
                          onClick={() => handleSelectGenre(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      </WrapItem>
                    ))}
                  </Wrap>
                )}
                <Wrap>
                  {genres.map((genre) => (
                    <WrapItem key={genre}>
                      <Badge
                        variant="subtle"
                        colorScheme="blue"
                        fontSize={'2xs'}
                      >
                        {genre}
                        <IconButton
                          icon={<Icon as={FiX} />}
                          size={'2xs'}
                          ml="1"
                          onClick={() => handleRemoveGenre(genre)}
                          aria-label="Remove Instrument"
                        />
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
              </FormControl>
              <FormControl flex={1} textAlign={'center'}>
                <FormLabel
                  fontSize={'12px'}
                  textAlign={'center'}
                  color={'#6899FE'}
                >
                  Location
                </FormLabel>
                <Autocomplete
                  location={location}
                  setLocation={setLocation}
                  businessLocation={businessLocation}
                  setBusinessLocation={setBusinessLocation}
                />
              </FormControl>
            </Stack>
            <>
              <FormControl flex={1} mt={2}>
                <FormLabel
                  fontSize={'12px'}
                  textAlign={'center'}
                  color={'#6899FE'}
                >
                  Languages
                </FormLabel>
                <InputGroup>
                  <Select
                    height={'7'}
                    placeholder="Select your language"
                    fontSize={'12px'}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    ml={0}
                  >
                    {sortedLanguages.map((language, index) => (
                      <option key={language + index} value={language}>
                        {language}
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="sm"
                    ml={2}
                    color="#fff"
                    backgroundColor={'#6899fe'}
                    onClick={() => handleAddLanguage(selectedLanguage)}
                  >
                    +
                  </Button>
                </InputGroup>
                <Flex direction="row" mt="-1" flexWrap="wrap">
                  {selectedLanguages.map((language, index) => (
                    <Box
                      key={language + index}
                      mr={2}
                      mt={2}
                      position="relative"
                    >
                      <Flex alignItems="center">
                        <Badge
                          variant="solid"
                          colorScheme="blue"
                          borderRadius="md"
                          px="2"
                          py="1"
                          fontSize={'2xs'}
                          display="inline-flex"
                          alignItems="center"
                        >
                          {language}
                        </Badge>
                        <CloseButton
                          size="sm"
                          onClick={() => handleRemoveLanguage(language)}
                        />
                      </Flex>
                    </Box>
                  ))}
                </Flex>
              </FormControl>
              <Stack
                direction="row"
                flex={1}
                justifyContent="center"
                pt={8}
                alignItems="center"
              >
                <Button
                  type="submit"
                  isLoading={loading}
                  size={'sm'}
                  width={{ base: 'auto' }}
                  backgroundColor={'#6899fe'}
                  color={'#fff'}
                >
                  Filter
                </Button>
                <Button
                  onClick={() => {
                    resetForm();
                  }}
                  size={'sm'}
                  backgroundColor={'#6899fe'}
                  color={'#fff'}
                  width={{ base: 'auto' }}
                  variant="outline"
                >
                  Reset
                </Button>
                <Select
                  width={'100px'}
                  value={usersPerPage}
                  onChange={(e) => setUsersPerPage(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </Select>
              </Stack>
            </>
          </form>
          <Stack spacing={4} width="102%">
            {displayedUsers.length > 0 ? (
              <Wrap>
                <Divider
                  borderColor="gray.300"
                  width="90%"
                  m={3}
                  borderWidth="0.5px"
                />
                {displayedUsers.map((user) => (
                  <WrapItem key={user.id} width={'100%'}>
                    <UserCard user={user} isNetwork={true} />
                  </WrapItem>
                ))}
              </Wrap>
            ) : (
              <></>
            )}
          </Stack>
          <HStack>
            {currentPage > 0 && (
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                backgroundColor={'#6899FE'}
                color={'#fff'}
                width={'100px'}
              >
                Back
              </Button>
            )}
            {filteredUsers.length > usersPerPage * (currentPage + 1) && (
              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                backgroundColor={'#6899FE'}
                color={'#fff'}
                width={'100px'}
              >
                Next
              </Button>
            )}
          </HStack>
        </VStack>
      )}
    </Center>
  );
};

export default NetworkPage;

// {
//   "name": "musicom",
//   "version": "0.1.0",
//   "private": false,
//   "license": "UNLICENSED",
//   "dependencies": {
//     "@ashwamegh/react-link-preview": "^0.3.0",
//     "@chakra-ui/icons": "^2.0.19",
//     "@chakra-ui/react": "^2.8.2",
//     "@dhaiwat10/react-link-preview": "^1.15.0",
//     "@emoji-mart/data": "^1.1.2",
//     "@emoji-mart/react": "^1.1.1",
//     "@emotion/react": "^11.11.1",
//     "@emotion/styled": "^11.11.0",
//     "@mapbox/mapbox-sdk": "^0.15.2",
//     "@mapbox/search-js-react": "^1.0.0-beta.16",
//     "@reduxjs/toolkit": "^1.9.5",
//     "@testing-library/jest-dom": "^5.16.5",
//     "@testing-library/react": "^13.4.0",
//     "@testing-library/user-event": "^13.5.0",
//     "ajv": "^8.12.0",
//     "axios": "^1.4.0",
//     "caniuse-lite": "^1.0.30001562",
//     "cheerio": "^1.0.0-rc.12",
//     "chokidar": "^3.5.3",
//     "date-fns": "^2.30.0",
//     "emoji-mart": "^5.5.2",
//     "faker-js": "^1.0.0",
//     "firebase": "^9.23.0",
//     "framer-motion": "^10.16.5",
//     "leaflet": "^1.9.4",
//     "leaflet-geosearch": "^3.8.0",
//     "phosphor-react": "^1.4.1",
//     "react": "^18.2.0",
//     "react-algolia-places": "^0.1.2",
//     "react-autocomplete": "^1.8.1",
//     "react-chat-engine": "^0.1.0",
//     "react-dom": "^18.2.0",
//     "react-firebase-hooks": "^5.1.1",
//     "react-flags-select": "^2.2.3",
//     "react-google-autocomplete": "^2.7.3",
//     "react-hook-form": "^7.43.9",
//     "react-icons": "^4.8.0",
//     "react-leaflet": "^4.2.1",
//     "react-phone-input-2": "^2.15.1",
//     "react-player": "^2.12.0",
//     "react-query": "^3.39.3",
//     "react-redux": "^8.1.1",
//     "react-responsive-carousel": "^3.2.23",
//     "react-router-dom": "^6.11.2",
//     "react-scripts": "^3.0.1",
//     "react-textarea-autosize": "^8.4.1",
//     "redux": "^4.2.1",
//     "redux-persist": "^6.0.0",
//     "styled-components": "^6.0.0-rc.3",
//     "wavesurfer.js": "^7.0.0-beta.6",
//     "web-vitals": "^2.1.4"
//   },
//   "scripts": {
//     "start": "export SET NODE_OPTIONS=--openssl-legacy-provider && react-scripts start",
//     "build": "export SET NODE_OPTIONS=--openssl-legacy-provider && react-scripts build",
//     "test": "react-scripts test",
//     "eject": "react-scripts eject"
//   },
//   "eslintConfig": {
//     "extends": [
//       "react-app",
//       "react-app/jest"
//     ]
//   },
//   "browserslist": {
//     "production": [
//       ">0.2%",
//       "not dead",
//       "not op_mini all"
//     ],
//     "development": [
//       "last 1 chrome version",
//       "last 1 firefox version",
//       "last 1 safari version"
//     ]
//   }
// }
