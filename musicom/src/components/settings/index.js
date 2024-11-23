import {
  Box,
  Button,
  Center,
  Container,
  extendTheme,
  Flex,
  Text,
  VStack,
  useBreakpointValue,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  RadioGroup,
  Stack,
  Radio,
  Grid,
  GridItem,
  Icon,
  Switch,
  FormControl,
  FormLabel,
  useToast,
} from "@chakra-ui/react";
import { db } from "lib/firebase";
import { useAuth } from "hooks/auth";
import { useState,useEffect } from "react";
import { doc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";


export default function Settings() {
    const isMobile = useBreakpointValue({ base: true, md: false });   

    const { user } = useAuth();
    const [isProfilePrivate, setIsProfilePrivate] = useState(user?.isProfileLocked || false);
    const toast = useToast();

    useEffect(() => {
      // This effect ensures the toggle reflects the current privacy setting when the component mounts
      setIsProfilePrivate(user?.isProfileLocked || false);
    }, [user?.isProfileLocked]);

    const handleToggleProfilePrivacy = async () => {
      const newPrivacyStatus = !isProfilePrivate;
      setIsProfilePrivate(newPrivacyStatus);

      try {
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, {
          isProfileLocked: newPrivacyStatus,
        });
        toast({
          title: "Privacy Updated",
          description: `Your profile is now ${newPrivacyStatus ? 'private' : 'public'}.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error updating profile privacy:", error);
        toast({
          title: "Error",
          description: "Failed to update privacy setting. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        // Revert the toggle state in case of an error
        setIsProfilePrivate(!newPrivacyStatus);
      }
    };
  

  return (
      <Center pt={20} width={isMobile ? "100%" : "100vw"}>
          <VStack spacing={6} align="center">
              {/* container 1*/}
              <Container spacing={6} align="center" maxW='container.xl' bg='gray.50' centerContent
              border='1px' borderColor='gray.200' borderRadius={'md'}> 
                  <Text
                  fontSize="3xl"
                  fontWeight="bold"
                  color="#1041B2"
                  >
                  Profile Information
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Name, Location and Instruments
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Personal Demographic Information
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Verification
                  </Text>
              </Container>
              
              {/* container 2*/}
              <Container spacing={6} align="center" maxW='container.xl' bg='gray.50' centerContent
              border='1px' borderColor='gray.200' borderRadius={'md'}> 
                  <Text
                  fontSize="3xl"
                  fontWeight="bold"
                  color="#1041B2"
                  >
                  Display
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Dark/Light mode
                  </Text>
              </Container>

              {/* container 3*/}
              <Container spacing={6} align="center" maxW='container.xl' bg='gray.50' centerContent
              border='1px' borderColor='gray.200' borderRadius={'md'}> 
                  <Text
                  fontSize="3xl"
                  fontWeight="bold"
                  color="#1041B2"
                  >
                  General Preferences
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Language
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Content Language
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Autoplay Videos
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Sound Effects
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Feed Preferences
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  People also viewed
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  People you unfollowed
                  </Text>
              </Container>

              {/* container 4*/}
              <Container spacing={6} align="center" maxW='container.xl' bg='gray.50' centerContent
              border='1px' borderColor='gray.200' borderRadius={'md'}> 
                  <Text
                  fontSize="3xl"
                  fontWeight="bold"
                  color="#1041B2"
                  >
                  Syncing Options
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Sync Calendar
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Sync Contacts
                  </Text>
              </Container>

              {/* container 5*/}
              <Container spacing={6} align="center" maxW='container.xl' bg='gray.50' centerContent
              border='1px' borderColor='gray.200' borderRadius={'md'}> 
                  <Text
                  fontSize="3xl"
                  fontWeight="bold"
                  color="#1041B2"
                  >
                  Subscriptions & Payments
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Upgrade to Pro
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  View Purchase History
                  </Text>
              </Container>

              {/* container 6*/}
              <Container spacing={6} align="center" maxW='container.xl' bg='gray.50' centerContent
              border='1px' borderColor='gray.200' borderRadius={'md'}> 
                  <Text
                  fontSize="3xl"
                  fontWeight="bold"
                  color="#1041B2"
                  >
                  Partners & Services
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  -
                  </Text>
              </Container>

              {/* container 7*/}
              <Container spacing={6} align="center" maxW='container.xl' bg='gray.50' centerContent
              border='1px' borderColor='gray.200' borderRadius={'md'}> 
                  <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  color="#1041B2"
                  >
                  Account Management
                  </Text>
                    <FormControl display="flex" alignItems="center">
                        <Text
                            color="#1041B2"
                            margin={"2.5px"}
                            >
                            Private Account
                            </Text>
                        <Switch
                          id="profile-privacy"
                          isChecked={isProfilePrivate}
                          onChange={handleToggleProfilePrivacy}
                        />
                    </FormControl>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Hibernate Account
                  </Text>
                  <Text
                  color="#1041B2"
                  margin={"2.5px"}
                  >
                  Close Account
                  </Text>
              </Container>
          </VStack>
      </Center>
  )
}