import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "hooks/auth";
import { FooterIcons } from "components/navbar";
import Navbar from "components/navbar";
import {
  Box,
  CircularProgress,
  Divider,
  Flex,
  HStack,
  Image,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Spinner,
  useBreakpointValue,
  useColorMode,
  VStack,
} from "@chakra-ui/react";
import logo from "Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Icon Logo copy@0.75x.png";
import { LOGIN } from "lib/routes";

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [isColorModeInitialized, setIsColorModeInitialized] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    const savedColorMode = localStorage.getItem("colorMode");
    if (savedColorMode && savedColorMode !== colorMode) {
      toggleColorMode(savedColorMode); // Set the initial color mode based on the saved value
      setIsColorModeInitialized(true);
    } else {
      setIsColorModeInitialized(true);
    }
  }, [colorMode, toggleColorMode]);

  useEffect(() => {
    if (isColorModeInitialized) {
      localStorage.setItem("colorMode", colorMode); // Save the color mode to local storage
    }
  }, [colorMode, isColorModeInitialized]);

  useEffect(() => {
    if (
      isColorModeInitialized &&
      !isLoading &&
      !user &&
      !pathname.startsWith("/protected")
    ) {
      navigate(LOGIN);
    }
  }, [user, isLoading, pathname, navigate, isColorModeInitialized]);

  const isMobile = useBreakpointValue({ base: true, md: false });

  if (isLoading || !isColorModeInitialized) {
    return (
      <Box maxW="full" align="center">
        <Box pb="20">
          <Navbar colorMode={colorMode} toggleColorMode={toggleColorMode} />
        </Box>
        {pathname.startsWith("/protected/dashboard") && (
          <>
            <Box
              maxW="600px"
              mx={{ base: "auto", md: "auto" }}
              mt="20"
              p={4}
              boxShadow="md"
              rounded="md"
              bg="white"
            >
              <SkeletonCircle size="10" />
              <SkeletonText
                mt="4"
                noOfLines={4}
                spacing="4"
                skeletonHeight="2"
              />
              <HStack spacing={4} pt={5} align="start">
                <SkeletonCircle size={5} />
                <SkeletonCircle size={5} />
                <SkeletonCircle size={5} />
              </HStack>
            </Box>
            <Box
              maxW="400px"
              p={4}
              boxShadow="md"
              rounded="md"
              bg="white"
              mt={20}
            >
              <SkeletonCircle size="10" />
              <SkeletonText
                mt="4"
                noOfLines={4}
                spacing="4"
                skeletonHeight="2"
              />
              <HStack spacing={4} pt={5} align="start">
                <SkeletonCircle size={5} />
                <SkeletonCircle size={5} />
              </HStack>
            </Box>
            <Box
              maxW="400px"
              p={4}
              boxShadow="md"
              rounded="md"
              bg="white"
              mt={5}
            >
              <SkeletonCircle size="10" />
              <SkeletonText
                mt="4"
                noOfLines={4}
                spacing="4"
                skeletonHeight="2"
              />
              <HStack spacing={4} pt={5} align="start">
                <SkeletonCircle size={5} />
                <SkeletonCircle size={5} />
              </HStack>
            </Box>
          </>
        )}
        {pathname.startsWith("/protected/profile") && (
          <>
            <Box pt={20} pl={{ base: "", md: "60" }} width="100%">
              <VStack spacing={6} align="" maxW="container.lg">
                <Flex direction={["column", "row"]} align="start">
                  <SkeletonCircle size="20" />
                  <VStack spacing={2} align="start" ml={[0, 4]}>
                    <Skeleton height="16px" width="120px" />
                    <Skeleton height="20px" width="200px" />
                    <Skeleton height="16px" width="180px" />
                    <Skeleton height="16px" width="150px" />
                    <HStack>
                      <Skeleton height="20px" width="80px" />
                      <Skeleton height="20px" width="80px" />
                    </HStack>
                  </VStack>
                </Flex>
                <Divider />
                <Box
                  maxW="400px"
                  p={4}
                  boxShadow="md"
                  rounded="md"
                  bg="white"
                  mt={20}
                >
                  <SkeletonCircle size="10" />
                  <SkeletonText
                    mt="4"
                    noOfLines={4}
                    spacing="4"
                    skeletonHeight="2"
                  />
                  <HStack spacing={4} pt={5} align="start">
                    <SkeletonCircle size={5} />
                    <SkeletonCircle size={5} />
                  </HStack>
                </Box>
                <Box
                  maxW="400px"
                  p={4}
                  boxShadow="md"
                  rounded="md"
                  bg="white"
                  mt={5}
                >
                  <SkeletonCircle size="10" />
                  <SkeletonText
                    mt="4"
                    noOfLines={4}
                    spacing="4"
                    skeletonHeight="2"
                  />
                  <HStack spacing={4} pt={5} align="start">
                    <SkeletonCircle size={5} />
                    <SkeletonCircle size={5} />
                  </HStack>
                </Box>
              </VStack>
            </Box>
          </>
        )}
      </Box>
    );
  }
  if (pathname === "/protected/messagemu") {
    if (isMobile) {
      return (
        <>
          <Navbar />
          <Flex
            pt="5"
            pb={{ base: "28", md: "0" }}
            mx="auto"
            w="auto"
            flexDirection="column"
            minHeight="100vh"
          >
            <Box alignContent="center">
              <Outlet />
              <FooterIcons />
            </Box>
          </Flex>
        </>
      );
    }
  }
  return (
    <>
      <Navbar />
      <Flex
        pt="5"
        pb={{ base: "28", md: "0" }}
        mx="auto"
        w={{
          base: pathname === "/protected/dashboard" ? "fill" : "sm",
          md: "auto",
        }}
        flexDirection="column"
        minHeight="100vh"
      >
        <Box alignContent={"center"}>
          <Outlet />
          <FooterIcons />
        </Box>
      </Flex>
    </>
  );
}
