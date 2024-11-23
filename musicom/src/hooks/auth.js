import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import { auth, db } from "lib/firebase";
import { useEffect, useState } from "react";
import { DASHBOARD, LOGIN } from "lib/routes";
import {
 signInWithEmailAndPassword,
 createUserWithEmailAndPassword,
 sendEmailVerification,
 sendPasswordResetEmail,
} from "firebase/auth";
import { useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
 setDoc,
 doc,
 getDoc,
 getDocs,
 collection,
 where,
 query,
 updateDoc,
} from "firebase/firestore";
import isUsernameExists from "utils/isUsernameExists";
import { get as _get } from "lodash"; // Import lodash get to safely access properties

export function useAuth() {
 const [authUser, authLoading, error] = useAuthState(auth);
 const [isLoading, setLoading] = useState(true);
 const [user, setUser] = useState(null);

 useEffect(() => {
  async function fetchData() {
   setLoading(true);
   try {
    if (authUser) {
     const ref = doc(db, "users", authUser.uid);
     const businessRef = doc(db, "businesses", authUser.uid);
     const docSnap = await getDoc(ref);
     const businessSnap = await getDoc(businessRef);
     if (docSnap.exists()) {
      setUser(docSnap.data());
     } else if (businessSnap.exists()) {
      setUser(businessSnap.data());
     } else {
      setUser(null);
     }
    } else {
     setUser(null);
    }
   } catch (error) {
    console.error("Error fetching data: ", error);
    setUser(null);
   }
   setLoading(false);
  }

  if (!authLoading) {
   fetchData();
   return;
  }
  return;
 }, [authLoading, authUser]);
 return { user, isLoading, error };
}

export function useLogin() {
 const [isLoading, setLoading] = useState(false);
 const toast = useToast();
 const navigate = useNavigate();

 async function getEmailFromUsername(username) {
  try {
   const userQuerySnapshot = await getDocs(
    query(collection(db, "users"), where("username", "==", username))
   );
   const businessQuerySnapshot = await getDocs(
    query(collection(db, "businesses"), where("username", "==", username))
   );
   if (!userQuerySnapshot.empty) {
    return userQuerySnapshot.docs[0].data().email;
   } else if (!businessQuerySnapshot.empty) {
    return businessQuerySnapshot.docs[0].data().email;
   } else {
    throw new Error("No such username exists!");
   }
  } catch (error) {
   throw error; // Rethrow the error to be caught by the calling function
  }
 }

 function isValidEmail(email) {
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
 }

 async function login({ identifier, password, redirectTo = DASHBOARD }) {
  setLoading(true);

  let email;

  // Check if identifier is an email or a username
  if (isValidEmail(identifier)) {
   email = identifier;
  } else {
   // Identifier is a username, get the corresponding email
   try {
    email = await getEmailFromUsername(identifier);
   } catch (error) {
    toast({
     title: "Error",
     description: error.message, // Show the message from the error thrown in getEmailFromUsername
     status: "error",
     isClosable: true,
     position: "top",
     duration: 5000,
    });
    setLoading(false);
    return false;
   }
  }

  try {
   const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
   );
   if (!userCredential.user.emailVerified) {
    toast({
     title: "Email not verified",
     description: "Please verify your email to log in",
     status: "error",
     isClosable: true,
     position: "top",
     duration: 5000,
    });

    navigate(LOGIN);
    setLoading(false);
    return false; // Return false if login failed due to unverified email
   }

   toast({
    title: "You are logged in",
    status: "success",
    isClosable: true,
    position: "top",
    duration: 5000,
   });

   navigate(redirectTo);
   setLoading(false);
   return true; // Return true if login succeeded
  } catch (error) {
   let errorMessage;
   switch (error.code) {
    case "auth/user-not-found":
     errorMessage = "Email does not exist";
     break;
    case "auth/invalid-email":
     errorMessage = "Invalid email format";
     break;
    default:
     errorMessage = error.message;
     break;
   }
   toast({
    title: "Logging in failed",
    description: errorMessage,
    status: "error",
    isClosable: true,
    position: "top",
    duration: 5000,
   });
   setLoading(false);
   return false; // Return false if login failed
  }
 }

 return { login, isLoading };
}

export function useRegister() {
 const [isLoading, setLoading] = useState(false);
 const navigate = useNavigate();
 const toast = useToast();

 async function register({
  username,
  email,
  password,
  fullName,
  role,
  instrument,
  genres,
  gender,
  location,
  signed,
  languages,
  redirectTo = DASHBOARD,
  referralCode,
 }) {
  setLoading(true);

  const usernameExists = await isUsernameExists(username);
  if (usernameExists.exists) {
   toast({
    title: "Username already exists",
    status: "error",
    isClosable: true,
    position: "top",
    duration: 5000,
   });
   setLoading(false);
  } else {
   try {
    const res = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", res.user.uid), {
     id: res.user.uid,
     username: username.toLowerCase(),
     email: email,
     avatar: "",
     fullName,
     role,
     genres,
     instrument,
     gender,
     location,
     signed,
     languages,
     date: Date.now(),
     referralCode,
    });

    if (referralCode) {
     await updateReferralCodeStatus(referralCode, "registered");
    }

    await sendEmailVerification(auth.currentUser);

    toast({
     title: "Account created",
     description: "Your account is created, verify it",
     status: "success",
     isClosable: true,
     position: "top",
     duration: 5000,
    });

    navigate(redirectTo);
   } catch (error) {
    toast({
     title: "Signing Up failed",
     description: error.message,
     status: "error",
     isClosable: true,
     position: "top",
     duration: 5000,
    });
   } finally {
    setLoading(false);
   }
  }

  setLoading(false);
 }

 return { register, isLoading };
}
const updateReferralCodeStatus = async (code, status) => {
 try {
  const referralCodesRef = collection(db, "referralCodes");
  const codeQuery = query(referralCodesRef, where("code", "==", code));
  const codeQuerySnapshot = await getDocs(codeQuery);
  if (codeQuerySnapshot.size > 0) {
   const codeDocRef = codeQuerySnapshot.docs[0].ref;
   await updateDoc(codeDocRef, { status: status });
  }
 } catch (error) {
  console.error("Error updating referral code status:", error);
 }
};

export function useRegisterBusiness() {
 const [isLoading, setLoading] = useState(false);
 const toast = useToast();
 const navigate = useNavigate();

 async function register({
  username,
  email,
  password,
  businessName,
  phoneNumber,
  natureOfBusiness,
  hq,
  locations,
  languages,
  redirectTo = DASHBOARD,
 }) {
  setLoading(true);

  const usernameExists = await isUsernameExists(username);
  if (usernameExists.exists) {
   toast({
    title: "Username already exists",
    status: "error",
    isClosable: true,
    position: "top",
    duration: 5000,
   });
   setLoading(false);
   return;
  }

  try {
   const res = await createUserWithEmailAndPassword(auth, email, password);

   // Convert locations to array of objects
   const locationsObj = locations.map(({ Nature, Addresses }) => ({
    Nature,
    Addresses: Addresses.map(([address, latitude, longitude]) => ({
     address,
     latitude,
     longitude,
    })),
   }));

   await setDoc(doc(db, "businesses", res.user.uid), {
    id: res.user.uid,
    username: username.toLowerCase(),
    email: email,
    avatar: "",
    businessName,
    phoneNumber,
    natureOfBusiness,
    hq,
    locations: locationsObj, // Use the converted locations array
    languages,
    date: Date.now(),
   });

   await sendEmailVerification(auth.currentUser);

   toast({
    title: "Account created",
    description: "You are logged in",
    status: "success",
    isClosable: true,
    position: "top",
    duration: 5000,
   });

   navigate(redirectTo);
  } catch (error) {
   toast({
    title: "Signing Up failed",
    description: error.message,
    status: "error",
    isClosable: true,
    position: "top",
    duration: 5000,
   });
  } finally {
   setLoading(false);
  }
 }

 return { register, isLoading };
}

export function useResetPassword() {
 const [isLoading, setLoading] = useState(false);
 const toast = useToast();
 const navigate = useNavigate();

 async function reset({ email }, redirectTo = LOGIN) {
  setLoading(true);

  try {
   await sendPasswordResetEmail(auth, email);
   toast({
    title: "Password reset email sent",
    description: "Check your email to reset the password",
    status: "success",
    isClosable: true,
    position: "top",
    duration: 5000,
   });

   navigate(redirectTo);
   setLoading(false);
  } catch (error) {
   toast({
    title: "Reset of the password failed",
    description: error.message,
    status: "error",
    isClosable: true,
    position: "top",
    duration: 5000,
   });
   setLoading(false);
   return false; // Return false if reset failed
  }

  setLoading(false);
  return true; // Return true if reset succeeded
 }

 return { reset, isLoading };
}

export function useLogout() {
 const [signOut, isLoading, error] = useSignOut(auth);
 const toast = useToast();
 const navigate = useNavigate();

 async function logout() {
  if (await signOut()) {
   toast({
    title: "Successfully logged out",
    status: "success",
    isClosable: true,
    position: "top",
    duration: 5000,
   });
   navigate(LOGIN);
  } // else: show error [signOut() returns false if failed]
 }

 return { logout, isLoading };
}
