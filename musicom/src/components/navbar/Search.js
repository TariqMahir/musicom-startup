import React, { useState } from "react";
import {
  Box,
  Input,
  VStack,
  Text,
  Avatar,
  InputLeftElement,
  InputGroup,
  useColorMode,
  useBreakpointValue,
} from "@chakra-ui/react";
import { query, collection, where, getDocs } from "firebase/firestore";
import { db } from "lib/firebase";
import { PROTECTED } from "lib/routes";
import { SearchIcon } from "@chakra-ui/icons";

export default function SearchPage() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);

  const fetchUsers = async (searchQuery) => {
    const search = searchQuery.toLowerCase();
    try {
      const q = query(
        collection(db, "users"),
        where("username", ">=", search),
        where("username", "<=", search + "\uf8ff")
      );
      const busQ = query(
        collection(db, "businesses"),
        where("username", ">=", search),
        where("username", "<=", search + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      const businessQuerySnapshot = await getDocs(busQ);
      const users = [
        ...querySnapshot.docs.map((doc) => doc.data()),
        ...businessQuerySnapshot.docs.map((doc) => doc.data()),
      ];
      setUserResults(users);
      setSearchResults(users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setSearchQuery(inputValue);
    if (inputValue) {
      fetchUsers(inputValue);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchResultClick = (result, index) => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedResultIndex(index);
    window.location.href = `${PROTECTED}/profile/${result.username}`;
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      if (selectedResultIndex !== -1 && searchResults.length > 0) {
        const username = searchResults[selectedResultIndex];
        setSearchQuery("");
        setSearchResults([]);
        setSelectedResultIndex(-1);
        window.location.href = `${PROTECTED}/profile/${username.username}`;
      } else {
        const username = searchQuery.trim();
        window.location.href = `${PROTECTED}/profile/${username}`;
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedResultIndex((prevIndex) => {
        if (prevIndex === -1) {
          return searchResults.length - 1;
        } else {
          return Math.max(prevIndex - 1, -1);
        }
      });
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedResultIndex((prevIndex) => {
        if (prevIndex === searchResults.length - 1) {
          return -1;
        } else {
          return Math.min(prevIndex + 1, searchResults.length - 1);
        }
      });
    } else if (event.key === "Escape") {
      setSearchResults([]);
      setSelectedResultIndex(-1);
    } else {
      setSelectedResultIndex(-1); // Reset selected result index when a new key is pressed
    }
  };

  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box pt={20} pl={{ base: "", md: "60" }} width="100%">
      <VStack spacing={6} align="center" maxW="container.lg">
        <InputGroup
          border={colorMode === "light" ? "1px solid black" : "1px solid white"}
          borderRadius="lg"
          boxShadow="md"
          p={2}
          w="300px"
        >
          <InputLeftElement
            pointerEvents="none"
            color="gray.300"
            alignSelf="center"
            height="100%"
          >
            <SearchIcon />
          </InputLeftElement>
          <Input
            type="text"
            ml={7}
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            size={{ base: "sm", md: "lg" }}
            fontSize="xl"
            border="none"
            _focus={{ outline: "none" }}
          />
        </InputGroup>
        {searchResults.length > 0 && (
          <Box
            mt={2}
            p={2}
            borderRadius="md"
            boxShadow="md"
            backgroundColor={colorMode === "light" ? "white" : "gray.700"}
            color={colorMode === "light" ? "black" : "white"}
            zIndex={1}
            width="300px"
          >
            {searchResults.map((result, index) => (
              <Box
                key={result.id}
                onClick={() => handleSearchResultClick(result, index)}
                cursor="pointer"
                py={1}
                px={2}
                bg={selectedResultIndex === index ? "gray.200" : "transparent"}
                _hover={{ background: "gray.200" }}
                display="flex"
                alignItems="center"
              >
                <Avatar
                  size="sm"
                  border="2px solid #1041B2"
                  src={result.avatar}
                />
                <Text ml="2">{result.username}</Text>
              </Box>
            ))}
          </Box>
        )}
      </VStack>
    </Box>
  );
}
