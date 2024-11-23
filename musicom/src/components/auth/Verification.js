import { Box, Button, Center, Heading, Image, Link, Text } from "@chakra-ui/react"
import { LOGIN } from "lib/routes"
import logo from "Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Text Logo copy@0.75x.png"
import React from "react"
import { Link as RouterLink } from "react-router-dom"


export default function Verification(data) {
    const handleRedirectToMail = () => {
        const { userAgent } = navigator;

        window.location.href = "mailto:";
      };

    return (
        <Center w="100%" h="100vh">
            <Box mx="1" maxW="md" p="9" borderWidth="0px" borderRadius="lg">
                <Image src={logo} alt="Musicom Logo"></Image>
                <Heading mb="4" size="lg" textAlign="center">Verify your email address</Heading>
                <Text fontSize="xlg" align="center" mt="6">
                    Check your spams
                </Text>
                <Button mt="4" colorScheme="teal" size="md" w="full" onClick={handleRedirectToMail}>Go to Email</Button>
                <Text fontSize="xlg" align="center" mt="6">
                    Already verified?{" "}
                    <Link 
                    as={RouterLink}
                    to={LOGIN} 
                    color="teal.800" 
                    fontWeight="medium"
                    textDecor="underline" 
                    _hover={{ background: "teal.100"}}>
                        Log In
                    </Link>
                </Text>
            </Box>
        </Center>
    )
}