import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Text,
  useBreakpointValue,
  useColorMode,
  IconButton, 
  InputGroup,
  Input,
  InputRightElement,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "hooks/auth";
import { db } from "lib/firebase";
import { DealsComponent } from "components/profile";
import { onSnapshot } from "firebase/firestore";
import { IoFilterCircle, IoFilterCircleOutline } from "react-icons/io5";
import { FiMoreVertical } from "react-icons/fi";


const Requests = () => {
  const { user } = useAuth(); // Assuming useAuth provides user information
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const [requestCollection, setRequestCollection] = useState([]);

  useEffect(() => {
    const fetchRequests = () => {
      if (user) {
        try {
          const requestsRef = collection(
            db,
            user.businessName ? "businesses" : "users",
            user.id,
            "requests"
          );

          const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
            const requestsData = snapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            }));

            setRequestCollection(requestsData);
          });

          // Clean up the listener when the component unmounts or when the 'user' changes
          return () => unsubscribe();
        } catch (error) {
          console.error("Error setting up snapshot listener:", error);
        }
      }
    };

    fetchRequests();
  }, [user, setRequestCollection, db]);

  return (
    <Stack direction={"row"} height={isMobile ? "87vh" : "85vh"}>


      
      <Box
        position={"relative"}
        backgroundColor={colorMode === "light" ? "#fff" : "blackAlpha.300"}
        boxShadow={"sm"}
        zIndex={2}
        overflowY="scroll"
      >
        <InputGroup borderRadius="xl" backgroundColor="transparent" mt={2}> 
          <Input
            type="text"
            placeholder="Search for a request"
            color="black"
            fontSize={12}
            mb={2}
            height={"6"}
          />
        <InputRightElement pointerEvents="none">
          <SearchIcon color="gray.300" mb={4} />
        </InputRightElement>
      </InputGroup>
        <Stack
          direction={"row"}
          alignItems={"center"}
          justifyContent={"space-between"}
        >
          
          <Text marginBottom={3} fontSize="14px" color="#6899FE">All Request</Text>
          <Box>
          <IconButton 
            backgroundColor={"transparent"}
            icon={<IoFilterCircleOutline color="#6899FE"/>}
            aria-label="Filter"
            size="sm"
            _hover={{ backgroundColor: "transparent" }} 
            ml={1}
          />
          <IconButton
            backgroundColor={'transparent'}
            icon={<FiMoreVertical color="#6899FE" />} 
            size="sm"
            _hover={{ backgroundColor: "transparent" }} 
          />
          </Box>
        </Stack>
        <DealsComponent receivedDeals={requestCollection} />
      </Box>
    </Stack>
  );
};

export default Requests;
