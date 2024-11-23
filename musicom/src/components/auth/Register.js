import {
 Box,
 Button,
 Link,
 Center,
 FormControl,
 FormErrorMessage,
 Heading,
 Image,
 Input,
 InputGroup,
 InputLeftElement,
 Text,
 IconButton,
 Icon,
 Select,
 FormLabel,
 Flex,
 Stack,
 Badge,
 Wrap,
 WrapItem,
 Tabs,
 TabList,
 Tab,
 TabPanels,
 TabPanel,
 CloseButton,
 Avatar,
} from "@chakra-ui/react";
import logo from "Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Text Logo copy@0.75x.png";
import React, { useEffect } from "react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { LOGIN, VERIFICATION } from "lib/routes";
import {
 AddIcon,
 AtSignIcon,
 CloseIcon,
 EmailIcon,
 ViewIcon,
 ViewOffIcon,
} from "@chakra-ui/icons";
import { useRegister, useRegisterBusiness } from "hooks/auth";
import { useForm } from "react-hook-form";
import {
 emailValidate,
 nameValidate,
 passwordValidate,
 selectValidate,
 usernameValidate,
} from "utils/form-validate";
import {
 BiEditAlt,
 BiGift,
 BiMap,
 BiMusic,
 BiStar,
 BiUniversalAccess,
 BiUser,
 BiWorld,
} from "react-icons/bi";
import { usePlacesWidget } from "react-google-autocomplete";
import axios from "axios";
import isUsernameExists from "utils/isUsernameExists";
import { isEmailExists } from "utils/isUsernameExists";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import industries from "lib/industries.json";
import musicRoles from "lib/musicRoles.json";
import {
 collection,
 getDocs,
 query,
 updateDoc,
 where,
} from "firebase/firestore";
import { db } from "lib/firebase";
import genresJSON from "lib/genres.json";
import { FiX } from "react-icons/fi";
import { FaMapMarkedAlt, FaMapMarker, FaMapMarkerAlt } from "react-icons/fa";
import { useLocation } from "react-router-dom";
//import ReferralCodeGenerator from './profile/referralCode.js';

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

const AddressAutocomplete = ({
 nature,
 businessLocation,
 setBusinessLocation,
 indexx,
}) => {
 const [searchQuery, setSearchQuery] = useState("");
 const [suggestions, setSuggestions] = useState([]);

 const handlePlaceSearch = async (value) => {
  setSearchQuery(value);

  try {
   const geocodingClient = mbxGeocoding({
    accessToken:
     "pk.eyJ1IjoiYWxlbGVudGluaSIsImEiOiJjbGk5ZWF5MnQwOHl2M25wcXBjamd3NjQ4In0.MpcjArF0h_rXY6O3LdqjwA",
   });
   const response = await geocodingClient
    .forwardGeocode({
     query: value,
     limit: 5,
     language: ["en"],
     types: ["address"],
    })
    .send();

   const results = response.body.features;

   const citySuggestions = results.map((result) => ({
    address: result.place_name,
    latitude: result.center[1],
    longitude: result.center[0],
   }));

   setSuggestions(citySuggestions);
  } catch (error) {
   console.error("Error fetching location suggestions:", error);
   setSuggestions([]);
  }
 };

 const handleKeyDown = (event) => {
  if (event.key === "Enter") {
   event.preventDefault();
   if (searchQuery.trim() !== "") {
    setBusinessLocation((prevLocations) => [
     ...(prevLocations || []), // Initialize as an empty array if null
     { Nature: searchQuery.trim(), Address: "" },
    ]);
    setSearchQuery("");
   }
  }
 };
 const handleSelectSuggestion = (selectedSuggestion) => {
  const { address, latitude, longitude } = selectedSuggestion;

  // Ensure that the nature value is correctly retrieved
  const selectedNature = nature
   ? Array.isArray(nature)
     ? nature.length > 0
       ? nature[indexx]
       : ""
     : nature
   : "";

  // Find the index of the entry with the same "Nature" if it exists
  const index = businessLocation.findIndex(
   (loc) => loc.Nature === selectedNature
  );

  if (index !== -1) {
   // If an entry with the same "Nature" exists, add the address to it
   setBusinessLocation((prevLocations) => {
    const updatedLocations = [...prevLocations];
    updatedLocations[index].Addresses.push([address, latitude, longitude]);
    return updatedLocations;
   });
  } else {
   // If no entry with the same "Nature" exists, create a new entry
   setBusinessLocation((prevLocations) => [
    ...prevLocations,
    {
     Nature: selectedNature, // Use the correctly retrieved nature value
     Addresses: [[address, latitude, longitude]],
    },
   ]);
  }

  setSearchQuery("");
  setSuggestions([]);
 };

 const handleDeleteAddress = (nature, addressToDelete) => {
  setBusinessLocation((prevLocations) => {
   return prevLocations
    .map((location) => {
     if (location.Nature === nature) {
      location.Addresses = location.Addresses.filter(
       (address) =>
        address[1] !== addressToDelete[1] || address[2] !== addressToDelete[2]
      );
     }
     return location;
    })
    .filter((location) => location.Addresses.length > 0);
  });
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
     value={searchQuery}
     onChange={(e) => handlePlaceSearch(e.target.value)}
     onKeyDown={handleKeyDown}
    />
   </InputGroup>
   <div style={{ width: "100%", overflowX: "auto" }}>
    {suggestions.length > 0 && (
     <Wrap mt={2} spacing={2}>
      {suggestions.map((suggestion, index) => (
       <WrapItem key={index}>
        <Badge
         colorScheme="blue"
         cursor="pointer"
         onClick={() => handleSelectSuggestion(suggestion)}
        >
         {suggestion.address}
        </Badge>
       </WrapItem>
      ))}
     </Wrap>
    )}
   </div>
   <Flex mt={2} direction="column">
    {(businessLocation && Array.isArray(businessLocation)
     ? businessLocation
     : []
    ).map((location, index) => {
     if (nature[index] === nature[indexx]) {
      return (
       <Box key={index} mb={2}>
        {Array.isArray(location.Addresses)
         ? location.Addresses.map((address, addressIndex) => (
            <Flex key={addressIndex} alignItems="center">
             <Badge colorScheme="green" mr={2} mb={1} py={1}>
              {address[0]}
             </Badge>
             <CloseButton
              size="sm"
              onClick={() => handleDeleteAddress(location.Nature, address)}
             />
            </Flex>
           ))
         : ""}
       </Box>
      );
     } else {
      <></>;
     }
    })}
   </Flex>
  </FormControl>
 );
};

export default function Register() {
 const { register: signup, isLoading } = useRegister();
 const { register: businessSignUp, isLoading: businessLoading } =
  useRegisterBusiness();
 const [showPassword, setShowPassword] = useState(false);
 const {
  register,
  handleSubmit,
  reset,
  formState: { errors },
  getValues,
  setValue,
  watch,
  trigger,
 } = useForm();
 const [step, setStep] = useState(1);
 const [referralCodeError, setReferralCodeError] = useState(null);
 const [referralCodeVerified, setReferralCodeVerified] = useState(false);
 const [referralUsername, setReferralUsername] = useState("");
 const [referralCodeFromUrl, setReferralCodeFromUrl] = useState("");
 const [referralCodeInput, setReferralCodeInput] = useState("");
 const handleNextStep = () => {
  setStep(step + 1);
 };

 const handlePrevStep = () => {
  setStep(step - 1);
 };

 const handleUserRegister = async (data) => {
  let referralCode = "";
  console.log(referralCodeVerified);
  if (referralCodeVerified) {
   referralCode = referralCodeInput;
  }
  console.log(referralCode);
  const succeeded = await signup({
   username: data.username,
   email: data.email,
   password: data.password,
   fullName: data.fullName,
   genres: genres,
   role: data.role,
   instrument: instruments,
   gender: data.gender,
   location: formLocation,
   signed: data.signed,
   languages: data.languages,
   redirectTo: VERIFICATION,
   referralCode: referralCodeVerified ? referralCodeInput : "",
  });
  if (succeeded) {
   reset();
  }
 };

 const handleBusinessRegister = async (data) => {
  let referralCode = "";
  if (referralCodeVerified) {
   referralCode = referralCodeInput || referralCodeFromUrl;
  }
  const succeeded = await businessSignUp({
   username: data.username,
   email: data.email,
   password: data.password,
   businessName: data.businessName,
   phoneNumber: `+${data.phoneNumber}`,
   natureOfBusiness: data.natureOfBusiness,
   hq: businessLocation,
   locations: businessLocationValues,
   languages: data.languages,
   redirectTo: VERIFICATION,
   referralCode: referralCode,
  });
  if (succeeded) reset();
 };
 const [referralAvatar, setReferralAvatar] = useState("");

 const verifyReferralCode = async (referralCode) => {
  try {
   const usersRef = collection(db, "users");
   const q = query(
    usersRef,
    where("referralCodes", "array-contains", referralCode)
   );
   const querySnapshot = await getDocs(q);
   console.log(querySnapshot);
   if (querySnapshot.size > 0) {
    const userData = querySnapshot.docs[0].data();
    const referralCodesRef = collection(db, "referralCodes");
    const codeQuery = query(
     referralCodesRef,
     where("code", "==", referralCode),
     where("status", "==", "active")
    );
    const codeQuerySnapshot = await getDocs(codeQuery);
    if (codeQuerySnapshot.size > 0) {
     setReferralCodeVerified(true);
     setReferralUsername("Referred by " + userData.username);
     setReferralAvatar(userData?.avatar || "");
     setReferralCodeError(null);
    } else {
     setReferralCodeVerified(false);
     setReferralUsername("");
     setReferralAvatar("");
     setReferralCodeError("Invalid referral code or status is not active");
    }
   } else {
    setReferralCodeVerified(false);
    setReferralUsername("");
    setReferralAvatar("");
    setReferralCodeError("Invalid referral code");
   }
  } catch (error) {
   console.error("Error verifying referral code:", error);
   setReferralCodeError("Invalid referral code");
  }
 };

 const roles = musicRoles.categorymembers.map((item) => item.title);

 const gender = ["Male", "Female", "Other"];
 const signed = [true, false];

 const sortedRoles = roles.sort((a, b) => a.localeCompare(b));

 const handleTogglePassword = () => {
  setShowPassword(!showPassword);
 };

 const [formLocation, setFormLocation] = useState("");

 const [businessLocation, setBusinessLocation] = useState([]);
 const [businessLocations, setBusinessLocations] = useState([
  {
   natureOfBusiness: "",
   businessLocation: [],
  },
 ]);

 const { ref } = usePlacesWidget({
  apiKey: "AIzaSyAiZbto8zmxYQnYqKo4YSq3ZknmncpxVbo",
  onPlaceSelected: (place) => {
   // Update location state when a location is selected
   setFormLocation(place.formatted_address);
  },
 });

 const fetchLanguages = async () => {
  try {
   const response = await axios.get("https://restcountries.com/v3.1/all");
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
   console.error("Error fetching language data:", error);
   return [];
  }
 };
 const [languages, setLanguages] = useState([]);

 // Fetch list of languages from the API
 useEffect(() => {
  axios
   .get("https://restcountries.com/v2/all")
   .then((response) => {
    setLanguages(response.data);
   })
   .catch((error) => {
    console.log("Error fetching languages:", error);
   });
 }, []);
 const [languageOptions, setLanguageOptions] = useState([]);

 useEffect(() => {
  const fetchLanguageOptions = async () => {
   const languages = await fetchLanguages();
   setLanguageOptions(languages);
  };

  fetchLanguageOptions();
 }, []);

 const uniqueLanguages = new Set();

 languages.forEach((country) => {
  country.languages.forEach((language) => {
   uniqueLanguages.add(language.name);
  });
 });
 const sortedLanguages = Array.from(uniqueLanguages).sort();

 const [businessCategories, setBusinessCategories] = useState([]);

 const fetchCategories = () => {
  setBusinessCategories(industries.industryCategories);
 };

 useEffect(() => {
  fetchCategories();
 }, []);

 const validateStep = () => {
  const fieldNames = Object.keys(register);
  const currentStepFields = fieldNames.slice(0, step);

  let isValid = currentStepFields.every((fieldName) => {
   if (fieldName === "username" && step !== 1) {
    return true; // Skip validation for username field in steps other than Step 1
   }

   const value = watch(fieldName);
   return value !== undefined && value !== "";
  });

  return isValid;
 };

 // Set field value and trigger validation
 const setValueAndValidate = (fieldName, value) => {
  setValue(fieldName, value, { shouldValidate: true });
 };

 const onSubmit = async (data) => {
  if (step === 1) {
   const { exists, alternatives } = await isUsernameExists(data.username);
   if (exists) {
    setUsernameError("Username already exists");
    setUsernameAlternatives(alternatives);
    return; // Return early if there are errors
   }
   if (!data.username) {
    setUsernameError("Username is required");
    return; // Return early if the username is empty
   }
  }

  if (step === 2) {
   const { exists } = await isEmailExists(data.email);
   if (exists) {
    setEmailError("Email already exists");
    return; // Return early if there are errors
   }

   if (!data.email) {
    setEmailError("Email is required");
    return; // Return early if the email is empty
   }
  }

  setUsernameError(null);
  setUsernameAlternatives([]);
  setEmailError(null);

  // Manually trigger validation before submitting the form
  const isValid = await trigger();
  if (!isValid) {
   return; // Return early if there are validation errors
  }

  // Continue with the submission logic
  if (step === 12 && signUp === "User") {
   const fetchLanguageOptions = async () => {
    const languages = await fetchLanguages();
    setLanguageOptions(languages);
   };

   fetchLanguageOptions();
   handleUserRegister(data);
  } else if (step === 9 && signUp === "Business") {
   handleBusinessRegister(data);
  } else {
   const fetchLanguageOptions = async () => {
    const languages = await fetchLanguages();
    setLanguageOptions(languages);
   };

   fetchLanguageOptions();
   handleNextStep();
  }
 };

 const [filteredRoles, setFilteredRoles] = useState(roles);
 const [searchValue, setSearchValue] = useState("");
 const [showOtherTextField, setShowOtherTextField] = useState(false);
 const [otherRole, setOtherRole] = useState("");

 const handleRoleSelectChange = (event) => {
  const { value } = event.target;
  if (value === "Other") {
   setShowOtherTextField(true);
   setValue("role", value);
  } else {
   setShowOtherTextField(false);
   setOtherRole("");
   setValue("role", value);
  }
 };

 const handleOtherRoleChange = (event) => {
  const { value } = event.target;
  setOtherRole(value);
  setValue("role", value);
 };

 const [showOtherBusinessTextField, setShowOtherBusinessTextField] =
  useState(false);
 const [otherBusiness, setOtherBusiness] = useState("");

 const handleBusinessCategorySelectChange = (event) => {
  const { value } = event.target;
  if (value === "Other") {
   setValue("natureOfBusiness", value);
   setShowOtherBusinessTextField(true);
  } else {
   setShowOtherBusinessTextField(false);
   setOtherBusiness("");
   setValue("natureOfBusiness", value);
  }
 };

 const handleOtherBusinessChange = (event) => {
  const { value } = event.target;
  setOtherBusiness(value);
  setValue("natureOfBusiness", value);
 };

 const [selectedLanguages, setSelectedLanguages] = useState([]);

 const handleAddLanguage = () => {
  const selectedLanguage = watch("languages");
  if (selectedLanguage && !selectedLanguages.includes(selectedLanguage)) {
   const updatedLanguages = [...selectedLanguages, selectedLanguage];
   setSelectedLanguages(updatedLanguages);
   setValue("languages", updatedLanguages, { shouldValidate: true });
  }
 };

 const handleRemoveLanguage = (language) => {
  const updatedLanguages = selectedLanguages.filter(
   (lang) => lang !== language
  );
  setSelectedLanguages(updatedLanguages);
  setValue("languages", updatedLanguages);
 };

 const handlePhoneNumberChange = (value, country, event) => {
  const phone = value;
  event.target = {
   ...event.target,
   value: phone,
   name: "phoneNumber",
  };
  register("phoneNumber", {
   required: "Phone Number is required",
   pattern: /^[0-9+\s]*$/, // Add additional pattern validation if needed
  }).onChange(event);
 };

 const [usernameError, setUsernameError] = useState(null);
 const [emailError, setEmailError] = useState(null);
 const [usernameAlternatives, setUsernameAlternatives] = useState([]);
 const [instruments, setInstruments] = useState([]);
 const [instrument, setInstrument] = useState("");
 const [instrumentSuggestions, setInstrumentSuggestions] = useState([]);

 const handleInstrumentChange = (e) => {
  const value = e.target.value;
  setValue("instrument", value);

  // Fetch instrument suggestions
  if (value.length >= 2) {
   axios
    .get(`https://musicbrainz.org/ws/2/instrument?query=${value}&limit=1`)
    .then((response) => {
     const instruments = response.data.instruments.map(
      (instrument) => instrument.name
     );
     setInstrumentSuggestions(instruments);
    })
    .catch((error) => {
     console.log("Error fetching instrument suggestions:", error);
     setInstrumentSuggestions([]);
    });
  } else {
   setInstrumentSuggestions([]);
  }
 };

 const [signUp, setSignUp] = useState("User");

 const handleBusinessOnClick = () => {
  setSignUp("Business");
 };

 const handleUserOnClick = () => {
  setSignUp("User");
 };
 const [genreSuggestions, setGenreSuggestions] = useState([]);

 const [genres, setGenres] = useState([]);
 const [genre, setGenre] = useState("");

 const fetchGenreSuggestions = async (value) => {
  try {
   const usersRef = collection(db, "users");
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
   console.log("Error fetching genres suggestions:", error);
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

 const handleInsertGenre = (e) => {
  if (e.key === "Enter" && genre.trim() !== "") {
   e.preventDefault();
   setGenres((prevGenres) => [...prevGenres, genre.trim()]);
   setGenre(""); // Clear the genre input field
   setGenreSuggestions([]); // Clear the genre suggestions
  }
 };

 const handleSelectGenre = (genre) => {
  setGenres((prevGenres) => [...prevGenres, genre]);
  setGenre(""); // Clear the genre input field
  setGenreSuggestions([]); // Clear the genre suggestions
 };

 const handleRemoveGenre = (genre) => {
  setGenres((prevGenres) => prevGenres.filter((item) => item !== genre));
 };

 const [errorMessage, setErrorMessage] = useState("");

 const [businessNatureList, setBusinessNatureList] = useState(1);

 const handleAddBusinessAddress = () => {
  setBusinessNatureList((prev) => prev + 1);
  setBusinessLocations((prevLocations) => [
   ...prevLocations,
   {
    natureOfBusiness: "",
    businessLocation: [],
   },
  ]);
 };

 const handleRemoveBusinessAddress = () => {
  if (businessNatureList > 1) {
   setBusinessNatureList((prev) => prev - 1);
   setBusinessLocations((prevLocations) => prevLocations.slice(0, -1));
  }
 };

 const [natureOfBusinessValues, setNatureOfBusinessValues] = useState(() => {
  return Array(businessNatureList).fill(businessCategories[0]);
 });

 const [businessLocationValues, setBusinessLocationValues] = useState([]);

 return (
  <Center w="100%" h="100vh">
   <Box mx="1" maxW="md" p="9" borderWidth="0px" borderRadius="lg">
    <Image src={logo} alt="Musicom Logo" />
    <Heading mb="4" size="md" textAlign="left">
     Register {signUp === "Business" ? "Business" : ""}
    </Heading>
    {signUp === "User" ? (
     // User Form
     <form onSubmit={handleSubmit(onSubmit)}>
      {step === 1 && (
       <Flex direction="column">
        <FormControl
         isInvalid={
          (errors.username && errors.username.type === "required") ||
          usernameError
         }
         py="2"
        >
         <FormLabel>Username</FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <AtSignIcon color="gray.300" />
          </InputLeftElement>
          <Input
           type="text"
           placeholder="Username"
           {...register("username", { ...usernameValidate })}
           onChange={async (e) => {
            const { exists, alternatives } = await isUsernameExists(
             e.target.value
            );
            if (exists) {
             setUsernameError("Username already exists");
             setUsernameAlternatives(alternatives); // Set alternatives
            } else {
             setUsernameError(null); // Clear any previous error
             setUsernameAlternatives([]); // Clear any previous alternatives
            }
            setValue("username", e.target.value);
           }}
          />
         </InputGroup>
         <FormErrorMessage>
          {errors.username?.type === "required"
           ? "Username is required"
           : errors.username?.message || usernameError}
         </FormErrorMessage>
        </FormControl>

        {usernameAlternatives.length > 0 && (
         <>
          <Text>Alternative usernames:</Text>
          {usernameAlternatives.map((alternative, index) => (
           <Button
            key={index}
            backgroundColor="transparent"
            onClick={() => setValueAndValidate("username", alternative)}
           >
            {alternative}
           </Button>
          ))}
         </>
        )}
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
         display={"inherit"}
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 12 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 2 && (
       <Flex direction="column">
        <FormControl
         isInvalid={
          (errors.email && errors.email.type === "required") || emailError
         }
         py="2"
        >
         <FormLabel>Email</FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <EmailIcon color="gray.300" />
          </InputLeftElement>
          <Input
           type="email"
           placeholder="Email Address"
           {...register("email", { ...emailValidate })}
           onChange={async (e) => {
            const { exists } = await isEmailExists(e.target.value);
            if (exists) {
             setEmailError("Email already exists");
            } else {
             setEmailError(null); // Clear any previous error
            }
            setValue("email", e.target.value);
           }}
          />
         </InputGroup>
         <FormErrorMessage>
          {errors.email?.message || emailError}
         </FormErrorMessage>
        </FormControl>

        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 12 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 3 && (
       <Flex direction="column">
        <FormControl isInvalid={errors.password} py="2">
         <FormLabel>Password</FormLabel>
         <InputGroup>
          <Input
           type={showPassword ? "text" : "password"}
           placeholder="Password"
           {...register("password", {
            ...passwordValidate,
            required: "Password is required",
           })}
          />
          <InputLeftElement>
           <IconButton
            background="none"
            color="gray.300"
            _hover={{ background: "none" }}
            icon={showPassword ? <ViewIcon /> : <ViewOffIcon />}
            onClick={handleTogglePassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
           />
          </InputLeftElement>
         </InputGroup>
         <FormErrorMessage>
          {errors.password && errors.password.message}
         </FormErrorMessage>
        </FormControl>
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 12 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 4 && (
       <Flex direction="column">
        <FormControl isInvalid={errors.fullName} py="2">
         <FormLabel>Full Name</FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <Box color="gray.300">
            <Icon as={BiUser} color="gray" />
           </Box>
          </InputLeftElement>
          <Input
           type="text"
           placeholder="Full Name"
           {...register("fullName", {
            ...nameValidate,
            required: "Full Name is required",
           })}
          />
         </InputGroup>
         <FormErrorMessage>
          {errors.fullName && errors.fullName.message}
         </FormErrorMessage>
        </FormControl>
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 12 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 5 && (
       <Flex direction="column">
        <FormControl isInvalid={errors.role} py="2">
         <FormLabel>Role</FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <Box color="gray.300" display="flex" alignItems="center">
            <Icon as={BiStar} color="gray" />
           </Box>
          </InputLeftElement>
          <Select
           placeholder="Select role"
           {...register("role", {
            ...selectValidate,
            required: showOtherTextField ? false : "Role is required",
           })}
           ml={10}
           value={watch("role")}
           onChange={handleRoleSelectChange}
          >
           {musicRoles.categorymembers.map((role) => (
            <option
             key={role.title}
             value={role.title}
             disabled={
              role.title === "PROFESSIONAL" ||
              role.title === "CREATIVE" ||
              role.title === "BUSINESS"
             }
            >
             {role.title}
            </option>
           ))}
           {/* <option value="Other">Other</option> */}
          </Select>
         </InputGroup>
         {showOtherTextField && (
          <Input
           type="text"
           placeholder="Enter other role"
           value={otherRole}
           onChange={handleOtherRoleChange}
           mt={2}
           required="Role required"
          />
         )}
         <FormErrorMessage>
          {errors.role && errors.role.message}
         </FormErrorMessage>
        </FormControl>
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 12 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 6 && (
       <Flex direction="column">
        <FormControl
         isInvalid={
          getValues("role") === "Instrumentalist" &&
          getValues("instrument") === "" &&
          instruments.length < 1
           ? true
           : false
         }
         py="2"
        >
         <FormLabel>
          Instrument{" "}
          {getValues("role") === "Instrumentalist" ? "" : "(Optional)"}
         </FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <Box color="gray.300">
            <Icon as={BiMusic} color="gray" />
           </Box>
          </InputLeftElement>
          <Input
           type="text"
           placeholder="Instrument"
           {...register("instrument")}
           onKeyDown={(e) => {
            if (e.key === "Enter") {
             e.preventDefault();
             const instrumentValue = getValues("instrument");
             if (instrumentValue) {
              setInstruments((prevInstruments) => [
               ...prevInstruments,
               instrumentValue,
              ]);
              setValue("instrument", ""); // Clear the instrument input field
              setInstrumentSuggestions([]); // Clear the instrument suggestions
             }
            }
           }}
           onChange={handleInstrumentChange}
          />
         </InputGroup>
         <FormErrorMessage>{errorMessage}</FormErrorMessage>
        </FormControl>
        <Stack direction="row" justifyContent="space-between">
         {instrumentSuggestions.length > 0 && (
          <Box mt="1">
           <Button
            variant="outline"
            colorScheme="blue"
            size="sm"
            onClick={() => {
             setValue("instrument", instrumentSuggestions[0]);
             setInstrumentSuggestions([]);
            }}
           >
            {instrumentSuggestions[0]}
           </Button>
          </Box>
         )}
         {getValues("instrument") && (
          <Text color="gray.500" mt="1">
           Press ENTER to select
          </Text>
         )}
        </Stack>
        <Wrap mt="1">
         {instruments.map((instrument, index) => (
          <WrapItem key={index} mr="1">
           <Flex align="center">
            <Badge variant="subtle" colorScheme="blue" fontSize="sm">
             {instrument}
            </Badge>
            <IconButton
             icon={<CloseIcon />}
             size="xs"
             ml="1"
             onClick={() => {
              setInstruments((prevInstruments) =>
               prevInstruments.filter((_, i) => i !== index)
              );
             }}
             aria-label="Remove Instrument"
            />
           </Flex>
          </WrapItem>
         ))}
        </Wrap>
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          disabled={
           getValues("role") === "Instrumentalist" &&
           getValues("instrument") === "" &&
           instruments.length < 1
            ? true
            : false
          }
          onClick={
           getValues("role") === "Instrumentalist" &&
           getValues("instrument") === "" &&
           instruments.length < 1
            ? () => {
               setErrorMessage("You need to enter an instrument");
              }
            : handleNextStep
          }
         >
          {step === 12 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 7 && (
       <Flex direction="column">
        <FormControl flex={1}>
         <FormLabel>Genres</FormLabel>
         <InputGroup>
          <Input
           type="text"
           placeholder="Genres"
           {...register("genres")}
           onKeyDown={(e) => {
            // if (e.key === "Enter") {
            //   e.preventDefault();
            //   const genresValue = getValues("genres");
            //   if (genresValue) {
            //     setGenre((prevGenres) => [...prevGenres, genres]);
            //     setValue("genres", ""); // Clear the instrument input field
            //     setGenreSuggestions([]); // Clear the instrument suggestions
            //   }
            // }
            handleInsertGenre(e);
           }}
           onChange={handleGenreChange}
          />
         </InputGroup>
         {genreSuggestions.length > 0 && (
          <Wrap mt={2} spacing={2}>
           {genreSuggestions.map((suggestion) => (
            <WrapItem key={suggestion}>
             <Badge
              colorScheme="blue"
              cursor="pointer"
              onClick={() => handleSelectGenre(suggestion)}
             >
              {suggestion}
             </Badge>
            </WrapItem>
           ))}
          </Wrap>
         )}
         <Wrap mt={2} mb={1}>
          {genres.map((genre) => (
           <WrapItem key={genre}>
            <Badge variant="subtle" colorScheme="blue" fontSize="sm">
             {genre}
             <IconButton
              icon={<Icon as={FiX} />}
              size="xs"
              ml="1"
              onClick={() => handleRemoveGenre(genre)}
              aria-label="Remove Instrument"
             />
            </Badge>
           </WrapItem>
          ))}
         </Wrap>
        </FormControl>
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 12 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 8 && (
       <Flex direction="column">
        <FormControl isInvalid={errors.gender} py="2">
         <FormLabel>Gender</FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <Box color="gray.300" display="flex" alignItems="center">
            <Icon as={BiUniversalAccess} color="gray" h="6" w="6" />
           </Box>
          </InputLeftElement>
          <Select
           placeholder="Select gender"
           {...register("gender", {
            ...selectValidate,
            required: "Gender is required",
           })}
           ml={10}
          >
           {gender.map((gender) => (
            <option key={gender} value={gender}>
             {gender}
            </option>
           ))}
          </Select>
         </InputGroup>
         <FormErrorMessage>
          {errors.gender && errors.gender.message}
         </FormErrorMessage>
        </FormControl>
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 12 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 9 && (
       <Flex direction="column">
        <PlacesAutocomplete
         location={formLocation}
         setLocation={setFormLocation}
        />
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 12 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 10 && (
       <Flex direction="column">
        <FormControl isInvalid={errors.signed} py="2">
         <FormLabel>Signed</FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <Box color="gray.300" display="flex" alignItems="center">
            <Icon as={BiEditAlt} color="gray" h="6" w="6" />
           </Box>
          </InputLeftElement>
          <Select
           placeholder="Are you signed?"
           {...register("signed", {
            ...selectValidate,
            required: "Signed is required",
           })}
           ml={10}
          >
           {signed.map((signed) => (
            <option key={signed} value={signed}>
             {signed == true ? "Yes" : "No"}
            </option>
           ))}
          </Select>
         </InputGroup>
         <FormErrorMessage>
          {errors.signed && errors.signed.message}
         </FormErrorMessage>
        </FormControl>
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 12 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 11 && (
       <Flex direction="column">
        <FormControl isInvalid={errors.languages} py="2">
         <FormLabel>Languages</FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <Box color="gray.300" display="flex" alignItems="center">
            <Icon as={BiWorld} color="gray" h="6" w="6" />
           </Box>
          </InputLeftElement>
          <Select
           placeholder="Select your language"
           {...register("languages", selectValidate)}
           ml={10}
          >
           {sortedLanguages?.map((languageName) => (
            <option key={languageName} value={languageName}>
             {languageName}
            </option>
           ))}
          </Select>
          <Button
           size="sm"
           color="blue"
           onClick={() => handleAddLanguage(watch("languages"))}
          >
           +
          </Button>
         </InputGroup>
         <FormErrorMessage>
          {errors.languages && errors.languages.message}
         </FormErrorMessage>
        </FormControl>
        <Flex direction="row" mt="4" flexWrap="wrap">
         {selectedLanguages.map((language) => (
          <Box key={language} mr={2} mt={2} position="relative">
           <Flex alignItems="center">
            <Badge
             variant="solid"
             colorScheme="blue"
             borderRadius="md"
             px="2"
             py="1"
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
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 12 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}

      {step === 12 && (
       <Flex direction="column">
        <FormControl isInvalid={referralCodeError} py="2">
         <FormLabel>Referral Code (Optional)</FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <Box color="gray.300" display="flex" alignItems="center">
            <Icon as={BiGift} color="gray" h="6" w="6" />
           </Box>
          </InputLeftElement>
          <Input
           type="text"
           placeholder="Enter Referral Code"
           value={referralCodeInput}
           onChange={(e) => setReferralCodeInput(e.target.value)}
          />
          <Button
           size="sm"
           color="blue"
           onClick={async () => {
            // Verify the referral code here
            const isValid = await verifyReferralCode(referralCodeInput);
           }}
          >
           Verify
          </Button>
         </InputGroup>
         <FormErrorMessage>{referralCodeError}</FormErrorMessage>
        </FormControl>

        {referralCodeVerified && (
         <Stack direction={"row"} justifyContent={"center"}>
          <Text fontSize="md" color="gray.600" textAlign="center" mt="2">
           {referralUsername}
          </Text>
          {referralAvatar && <Avatar src={referralAvatar} size={"sm"} />}
         </Stack>
        )}
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          type="submit"
          color="blue"
          size="md"
          isLoading={isLoading}
          loadingText="Signing Up..."
          disabled={!validateStep()}
         >
          Register
         </Button>
        </Stack>
       </Flex>
      )}
     </form>
    ) : (
     // Business Form
     <form onSubmit={handleSubmit(onSubmit)}>
      {step === 1 && (
       <Flex direction="column">
        <FormControl
         isInvalid={
          (errors.username && errors.username.type === "required") ||
          usernameError
         }
         py="2"
        >
         <FormLabel>Business Username</FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <AtSignIcon color="gray.300" />
          </InputLeftElement>
          <Input
           type="text"
           placeholder="Username"
           {...register("username", { ...usernameValidate })}
           onChange={async (e) => {
            const { exists, alternatives } = await isUsernameExists(
             e.target.value
            );
            if (exists) {
             setUsernameError("Username already exists");
             setUsernameAlternatives(alternatives); // Set alternatives
            } else {
             setUsernameError(null); // Clear any previous error
             setUsernameAlternatives([]); // Clear any previous alternatives
            }
            setValue("username", e.target.value);
           }}
          />
         </InputGroup>
         <FormErrorMessage>
          {errors.username?.type === "required"
           ? "Username is required"
           : errors.username?.message || usernameError}
         </FormErrorMessage>
        </FormControl>

        {usernameAlternatives.length > 0 && (
         <>
          <Text>Alternative usernames:</Text>
          {usernameAlternatives.map((alternative, index) => (
           <Button
            key={index}
            backgroundColor="transparent"
            onClick={() => setValueAndValidate("username", alternative)}
           >
            {alternative}
           </Button>
          ))}
         </>
        )}

        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 9 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 2 && (
       <Flex direction="column">
        <FormControl
         isInvalid={
          (errors.email && errors.email.type === "required") || emailError
         }
         py="2"
        >
         <FormLabel>Business Email</FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <EmailIcon color="gray.300" />
          </InputLeftElement>
          <Input
           type="email"
           placeholder="Email Address"
           {...register("email", { ...emailValidate })}
           onChange={async (e) => {
            const { exists } = await isEmailExists(e.target.value);
            if (exists) {
             setEmailError("Email already exists");
            } else {
             setEmailError(null); // Clear any previous error
            }
            setValue("email", e.target.value);
           }}
          />
         </InputGroup>
         <FormErrorMessage>
          {errors.email?.message || emailError}
         </FormErrorMessage>
        </FormControl>

        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 9 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 3 && (
       <Flex direction="column">
        <FormControl isInvalid={errors.password} py="2">
         <FormLabel>Password</FormLabel>
         <InputGroup>
          <Input
           type={showPassword ? "text" : "password"}
           placeholder="Password"
           {...register("password", {
            ...passwordValidate,
            required: "Password is required",
           })}
          />
          <InputLeftElement>
           <IconButton
            background="none"
            color="gray.300"
            _hover={{ background: "none" }}
            icon={showPassword ? <ViewIcon /> : <ViewOffIcon />}
            onClick={handleTogglePassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
           />
          </InputLeftElement>
         </InputGroup>
         <FormErrorMessage>
          {errors.password && errors.password.message}
         </FormErrorMessage>
        </FormControl>
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 9 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 4 && (
       <Flex direction="column">
        <FormControl isInvalid={errors.businessName} py="2">
         <FormLabel>Business Name</FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <Box color="gray.300">
            <Icon as={BiUser} color="gray" />
           </Box>
          </InputLeftElement>
          <Input
           type="text"
           placeholder="Full Name"
           {...register("businessName", {
            ...nameValidate,
            required: "Business Name is required",
           })}
          />
         </InputGroup>
         <FormErrorMessage>
          {errors.businessName && errors.businessName.message}
         </FormErrorMessage>
        </FormControl>
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 9 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 5 && (
       <Flex direction="column">
        <FormControl py="2">
         <FormLabel>Phone Number</FormLabel>
         <InputGroup>
          <PhoneInput
           country={""}
           inputProps={{
            name: "phoneNumber",
           }}
           value={watch("phoneNumber")}
           onChange={handlePhoneNumberChange}
          />
         </InputGroup>
         <FormErrorMessage>
          {errors.phoneNumber && errors.phoneNumber.message}
         </FormErrorMessage>
        </FormControl>
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button color="blue" size="md" type="submit">
          {step === 9 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 6 && (
       <Flex direction="column">
        <FormControl isInvalid={errors.natureOfBusiness} py="2">
         <FormLabel>Nature of Business</FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <Box color="gray.300" display="flex" alignItems="center">
            <Icon as={BiWorld} color="gray" h="6" w="6" />
           </Box>
          </InputLeftElement>
          <Select
           placeholder="Select your business"
           {...register("natureOfBusiness", {
            ...selectValidate,
            required: showOtherBusinessTextField
             ? false
             : "Nature of Business is required",
           })}
           ml={10}
           value={watch("natureOfBusiness")}
           onChange={handleBusinessCategorySelectChange}
          >
           {businessCategories.map((business) => {
            if (business !== "HQ") {
             return (
              <option key={business} value={business}>
               {business}
              </option>
             );
            }
           })}
           <option value="Other">Other</option>
          </Select>
         </InputGroup>
         {showOtherBusinessTextField && (
          <Input
           type="text"
           placeholder="Enter other business"
           value={otherBusiness}
           onChange={handleOtherBusinessChange}
           mt={2}
           required="Nature of Business required"
          />
         )}
         <FormErrorMessage>
          {errors.natureOfBusiness && errors.natureOfBusiness.message}
         </FormErrorMessage>
        </FormControl>
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 9 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}

      {step === 7 && (
       <Flex direction="column">
        <Text>HQ</Text>
        {/* <AddressAutocomplete
                  setBusinessLocation={setBusinessLocation}
                  businessLocation={businessLocation}
                /> */}
        <PlacesAutocomplete
         setLocation={setBusinessLocation}
         location={businessLocation}
        />
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          color="blue"
          size="md"
          onClick={handleSubmit(onSubmit)}
          disabled={!validateStep()}
         >
          {step === 9 ? "Register" : "Next"}
         </Button>
        </Stack>
       </Flex>
      )}
      {step === 8 && (
       <div>
        {Array.from({ length: businessNatureList }).map((item, index) => {
         return (
          <Flex direction="column" key={index}>
           {index === 0 && <Text>Premise Location</Text>}
           <Flex direction="row" justifyContent="space-between">
            {/* Left column for business type */}
            <div>
             <FormControl py="2">
              <FormLabel>Nature of Business</FormLabel>
              <Flex direction={"row"}>
               <Button
                size="sm"
                color="blue"
                onClick={() => handleAddBusinessAddress(index + 1)}
               >
                +
               </Button>

               {index > 0 && (
                <Button
                 size="sm"
                 color="blue"
                 ml={1}
                 onClick={() => handleRemoveBusinessAddress(index - 1)}
                >
                 -
                </Button>
               )}
               <InputGroup minWidth={"100"} width={"auto"}>
                <Select
                 placeholder="Select your business"
                 {...register(`natureOfBusiness.${index}`, {
                  ...selectValidate,
                 })}
                 value={natureOfBusinessValues[index]}
                 onChange={(e) => {
                  const updatedValues = [...natureOfBusinessValues];
                  updatedValues[index] = e.target.value;
                  setNatureOfBusinessValues(updatedValues);
                  handleBusinessCategorySelectChange(e, index);
                 }}
                >
                 {businessCategories.map((business) => {
                  if (business !== "HQ") {
                   return (
                    <option key={business} value={business}>
                     {business}
                    </option>
                   );
                  }
                  return null;
                 })}
                 <option value="Other">Other</option>
                </Select>
               </InputGroup>
               {showOtherBusinessTextField && (
                <Input
                 type="text"
                 placeholder="Enter other business"
                 value={natureOfBusinessValues[index] || ""}
                 onChange={(e) => handleOtherBusinessChange(e, index)}
                 mt={2}
                 required="Nature of Business required"
                />
               )}

               <FormErrorMessage>
                {errors.natureOfBusiness &&
                 errors.natureOfBusiness[index]?.message}
               </FormErrorMessage>
              </Flex>
             </FormControl>
            </div>
            {/* Right column for business locations */}
            <div style={{ position: "relative", overflow: "auto" }}>
             <FormControl isInvalid={errors.businessLocation} py="2">
              <FormLabel>Business Location</FormLabel>
              <InputGroup>
               <InputLeftElement pointerEvents="none">
                <Box color="gray.300" display="flex" alignItems="center">
                 {/* <BiMap color="gray" h="6" w="6" /> */}
                </Box>
               </InputLeftElement>
              </InputGroup>
              <Stack width={"30"}>
               <AddressAutocomplete
                nature={natureOfBusinessValues}
                setBusinessLocation={setBusinessLocationValues}
                businessLocation={businessLocationValues}
                indexx={index}
               />
              </Stack>
             </FormControl>
            </div>
           </Flex>
          </Flex>
         );
        })}
       </div>
      )}

      {step === 8 && (
       <Stack
        direction="row"
        justifyContent="space-between"
        spacing="auto"
        mt="4"
       >
        {step > 1 && (
         <Button color="blue" size="md" onClick={handlePrevStep}>
          Previous
         </Button>
        )}
        <Button
         color="blue"
         size="md"
         onClick={handleSubmit(onSubmit)}
         disabled={!validateStep()}
        >
         {step === 9 ? "Register" : "Next"}
        </Button>
       </Stack>
      )}
      {step === 9 && (
       <Flex direction="column">
        <FormControl
         isInvalid={selectedLanguages ? false : errors.languages}
         py="2"
        >
         <FormLabel>Languages</FormLabel>
         <InputGroup>
          <InputLeftElement pointerEvents="none">
           <Box color="gray.300" display="flex" alignItems="center">
            <Icon as={BiWorld} color="gray" h="6" w="6" />
           </Box>
          </InputLeftElement>
          <Select
           placeholder="Select your language"
           {...register("languages", selectValidate)}
           ml={10}
          >
           {sortedLanguages.map((languageName) => (
            <option key={languageName} value={languageName}>
             {languageName}
            </option>
           ))}
          </Select>
          <Button
           size="sm"
           color="blue"
           onClick={() => handleAddLanguage(watch("languages"))}
          >
           +
          </Button>
         </InputGroup>
         <FormErrorMessage>
          {errors.languages && errors.languages.message}
         </FormErrorMessage>
        </FormControl>
        <Flex direction="row" mt="4" flexWrap="wrap">
         {selectedLanguages.map((language) => (
          <Box key={language} mr={2} mt={2} position="relative">
           <Flex alignItems="center">
            <Badge
             variant="solid"
             colorScheme="blue"
             borderRadius="md"
             px="2"
             py="1"
             display="inline-flex"
             alignItems="center"
            >
             {language}
            </Badge>
            <CloseButton
             size="sm"
             ml={2}
             onClick={() => handleRemoveLanguage(language)}
            />
           </Flex>
          </Box>
         ))}
        </Flex>
        <Stack
         direction="row"
         justifyContent="space-between"
         spacing="auto"
         mt="4"
        >
         {step > 1 && (
          <Button color="blue" size="md" onClick={handlePrevStep}>
           Previous
          </Button>
         )}
         <Button
          type="submit"
          color="blue"
          size="md"
          isLoading={isLoading}
          loadingText="Signing Up..."
          disabled={!validateStep()}
         >
          Register
         </Button>
        </Stack>
       </Flex>
      )}
     </form>
    )}
    <Text fontSize="xlg" align="center" mt="6">
     Already have an account?{" "}
     <Link
      as={RouterLink}
      to={LOGIN}
      color="teal.800"
      fontWeight="medium"
      textDecor="underline"
      _hover={{ background: "teal.100" }}
     >
      Log In
     </Link>
    </Text>
    {signUp === "User" && step === 1 ? (
     <Text fontSize="xlg" align="center" mt="6">
      Are you a business?{" "}
      <Link
       onClick={handleBusinessOnClick}
       color="teal.800"
       fontWeight="medium"
       textDecor="underline"
       _hover={{ background: "teal.100" }}
      >
       Register here
      </Link>
     </Text>
    ) : (
     signUp === "Business" &&
     step === 1 && (
      <div align="center">
       <Button alignContent={"center"} onClick={handleUserOnClick}>
        User's SignUp
       </Button>
      </div>
     )
    )}
   </Box>
  </Center>
 );
}
