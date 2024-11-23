import { Box, Button, Link, Center, FormControl, FormErrorMessage, Heading, Image, Input, InputGroup, InputLeftElement, Text } from "@chakra-ui/react";
import logo from "Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Text Logo copy@0.75x.png";
import React from "react";
import { useState } from 'react';
import { Link as RouterLink } from "react-router-dom";
import { LOGIN } from "lib/routes";
import { EmailIcon } from "@chakra-ui/icons";
import { useResetPassword } from "hooks/auth";
import { useForm } from "react-hook-form";
import { emailValidate, passwordValidate, usernameValidate } from "utils/form-validate";

export default function Reset() {
  const { reset, isLoading } = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  async function handleReset(data) {
    const succeeded = await reset({
      email: data.email,
      redirectTo: LOGIN,
    });
  }

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Center w="100%" h="100vh">
      <Box mx="1" maxW="md" p="9" borderWidth="0px" borderRadius="lg">
        <Image src={logo} alt="Musicom Logo" />
        <Heading mb="4" size="md" textAlign="left">Forgot Password</Heading>
        <form onSubmit={handleSubmit(handleReset)}>
          <FormControl isInvalid={errors.email} py="2">
            <InputGroup>
              <InputLeftElement pointerEvents='none'>
                <EmailIcon color='gray.300' />
              </InputLeftElement>
              <Input type='email' placeholder='Email Address' {...register('email', emailValidate)} />
            </InputGroup>
            <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
          </FormControl>
          <Button mt="4" type="submit" colorScheme="blue" size="md" w="full" isLoading={isLoading} loadingText="Signing Up...">Reset Password</Button>
        </form>
        <Text fontSize="xlg" align="center" mt="6">
          Remember the password?{" "}
          <Link
            as={RouterLink}
            to={LOGIN}
            color="teal.800"
            fontWeight="medium"
            textDecor="underline"
            _hover={{ background: "teal.100" }}>
            Log In
          </Link>
        </Text>
      </Box>
    </Center>
  );
}
