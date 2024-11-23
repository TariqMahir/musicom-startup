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
  Flex,
  Checkbox,
} from "@chakra-ui/react";
import logo from "Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Text Logo copy@0.75x.png";
import React, { useEffect } from "react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { DASHBOARD, REGISTER, RESET } from "lib/routes";
import { AtSignIcon, ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useLogin } from "hooks/auth";
import { useForm } from "react-hook-form";
import { passwordValidate } from "utils/form-validate";

export default function Login() {
  const { login, isLoading } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const [saveCredentials, setSaveCredentials] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  async function handleLogin(data) {
    if (saveCredentials) {
      localStorage.setItem("savedEmail", data.identifier);
      localStorage.setItem("savedPassword", data.password);
    } else {
      localStorage.removeItem("savedEmail");
      localStorage.removeItem("savedPassword");
    }

    const succeeded = await login({
      identifier: data.identifier,
      password: data.password,
      redirectTo: DASHBOARD,
    });
    if (succeeded) reset();
  }

  const handleSaveCredentialsChange = (e) => {
    setSaveCredentials(e.target.checked);
  };

  useEffect(() => {
    const savedIdentifier = localStorage.getItem("savedIdentifier");
    const savedPassword = localStorage.getItem("savedPassword");

    if (savedIdentifier && savedPassword) {
      reset({
        identifier: savedIdentifier,
        password: savedPassword,
      });
      setSaveCredentials(true);
    }
  }, []);

  return (
    <Center w="100%" h="100vh">
      <Box mx="1" maxW="md" p="9" borderWidth="0px" borderRadius="lg">
        <Image src={logo} alt="Musicom Logo"></Image>
        <Heading mb="4" size="md" textAlign="left">
          Log In
        </Heading>
        <form onSubmit={handleSubmit(handleLogin)}>
          <FormControl isInvalid={errors.identifier} py="2">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <AtSignIcon color="gray.300" />
              </InputLeftElement>
              <Input
                type="text"
                placeholder="Email Address or Username"
                {...register("identifier")}
              />
            </InputGroup>
            <FormErrorMessage>
              {errors.identifier && errors.identifier.message}
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={errors.password} py="2">
            <InputGroup>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                {...register("password", passwordValidate)}
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
          <Flex align="center" justify="space-between" mt="4">
            <Checkbox
              id="saveCredentials"
              isChecked={saveCredentials}
              onChange={handleSaveCredentialsChange}
              size="md"
              colorScheme="blue"
            >
              Remember Me
            </Checkbox>
            <Link
              as={RouterLink}
              to={RESET}
              color="teal.800"
              fontSize="sm"
              fontWeight="medium"
              textDecor="underline"
              _hover={{ background: "teal.100" }}
            >
              Forgot Password?
            </Link>
          </Flex>
          <Button
            mt="4"
            type="submit"
            colorScheme="blue"
            size="md"
            w="full"
            isLoading={isLoading}
            loadingText="Logging In..."
          >
            Log In
          </Button>
        </form>
        <Text fontSize="xlg" align="center" mt="6">
          Don't have an account?{" "}
          <Link
            as={RouterLink}
            to={REGISTER}
            color="teal.800"
            fontWeight="medium"
            textDecor="underline"
            _hover={{ background: "teal.100" }}
          >
            Register
          </Link>
        </Text>
      </Box>
    </Center>
  );
}
