import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Center,
  Heading,
  Text,
  VStack,
  useBreakpointValue,
  List,
  ListItem,
  ListIcon,
  Image,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Input,
  ModalFooter,
  Alert,
} from '@chakra-ui/react';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useAuth } from 'hooks/auth';
import { app, db } from 'lib/firebase';
import { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { BILLING } from 'lib/routes';
import { getApp } from 'firebase/app';
import { FiCheckCircle } from 'react-icons/fi';
import logoM from 'Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Icon Logo copy@0.75x.png';
import Lottie from 'lottie-react';
import lottieanimation from './lottieanimation';
import { loadStripe } from '@stripe/stripe-js';
import { CreateCheckout } from 'stripe/createCheckoutSession';

const stripePromise = loadStripe('pk_test_kVvpQ0cpRv7Vaiej2evvTMsb');

const benefitsData = [
  'Messages+ : Send any files of any file size!',
  'Network+ : Show up at the top on the Network search page by giving you more visibility',
  'Finder+ : Get unlimited use of finder, search for any business around you and in other cities',
  'PayMu : Be able to buy files or Sell files to any Pro user!',
];

const generateReferralCode = async (user) => {
  const referralCode = generateRandomCode(); // generate a random referral code

  const usersRef = collection(db, 'users');
  const referralCodesRef = collection(db, 'referralCodes');

  // check if the referral code already exists under any user
  const existingReferralCodeQuery = query(
    usersRef,
    where('referralCodes', 'array-contains', referralCode)
  );
  const existingReferralCodeSnapshot = await getDocs(existingReferralCodeQuery);

  if (existingReferralCodeSnapshot.docs.length > 0) {
    throw new Error('Referral code already exists under another user');
  }

  // add the referral code to the user's collection
  const userDocRef = doc(usersRef, user.id);
  await updateDoc(userDocRef, {
    referralCodes: arrayUnion(referralCode),
  });

  // create a new document to store the referral code and its status
  const newReferralCodeDocRef = await addDoc(referralCodesRef, {
    code: referralCode,
    userId: user.id,
    status: 'active',
  });

  return referralCode;
};

const generateRandomCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const codeLength = 8;
  let code = '';

  for (let i = 0; i < codeLength; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return code;
};

const getActiveSubscription = async (user) => {
  try {
    const snapshot = await getDocs(
      query(
        collection(
          db,
          user?.businessName ? 'businesses' : 'users',
          user?.id,
          'subscriptions'
        ),
        where('status', 'in', ['trialing', 'active'])
      )
    );

    if (snapshot.docs.length > 0) {
      const doc = snapshot.docs[0];
      return doc.data().status;
    } else {
      console.log('No active or trialing subscription found.');
      return null;
    }
  } catch (error) {
    console.error('Error getting active subscription:', error);
    throw error;
  }
};

const getPortalUrl = async (user) => {
  const functions = getFunctions(getApp(), 'europe-west2');
  const functionRef = httpsCallable(
    functions,
    'ext-firestore-stripe-payments-createPortalLink'
  );

  try {
    const { data } = await functionRef({
      returnUrl: window.location.origin + BILLING,
      locale: 'auto', // Optional, defaults to "auto"
    });

    window.location.assign(data.url);
  } catch (error) {
    console.error(error);
  }
};

const calculateMonthlyRewards = async (user) => {
  const functions = getFunctions(getApp(), 'us-central1');
  const functionRef = httpsCallable(functions, 'calculateMonthlyRewards');

  try {
    const result = await functionRef({ userId: user.id });
    return result.data;
  } catch (error) {
    console.error(error);
  }
};

const getWithdrawalStatus = async (user) => {
  const withdrawalRef = doc(db, 'withdrawals', user.id);
  const withdrawalDoc = await getDoc(withdrawalRef);

  if (withdrawalDoc.exists()) {
    return withdrawalDoc.data().status;
  } else {
    return null;
  }
};

const getNextWithdrawalDate = async (user) => {
  const withdrawalRef = doc(db, 'withdrawals', user.id);
  const withdrawalDoc = await getDoc(withdrawalRef);

  if (withdrawalDoc.exists) {
    const nextWithdrawalDate = withdrawalDoc.data().nextWithdrawalDate;
    return nextWithdrawalDate;
  } else {
    return null;
  }
};

const getNextMonthDate = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
};

const getActiveSubscriptionDocRef = async (user) => {
  try {
    const snapshot = await getDocs(
      query(
        collection(
          db,
          user?.businessName ? 'businesses' : 'users',
          user?.id,
          'subscriptions'
        ),
        where('status', 'in', ['trialing', 'active'])
      )
    );

    if (snapshot.docs.length > 0) {
      const doc = snapshot.docs[0];
      return doc.ref;
    } else {
      console.log('No active or trialing subscription found.');
      return null;
    }
  } catch (error) {
    console.error('Error checking subscription status:', error);
    throw new Error('Error checking subscription status');
  }
};

// const createCheckoutSession = async (user) => {
//   const functions = getFunctions(getApp(), 'europe-west2');
//   const createCheckoutSession = httpsCallable(
//     functions,
//     'ext-firestore-stripe-payments-createCheckoutSession'
//   );

//   try {
//     const { data } = await createCheckoutSession({
//       priceId: 'price_1OMVNxJwYkGBUeJ3zNKb6ASI', // Replace with your actual price ID
//       success_url: window.location.origin + '/success',
//       cancel_url: window.location.origin + '/cancel',
//     });

//     const stripe = await stripePromise;
//     const { sessionId } = data;
//     await stripe.redirectToCheckout({ sessionId });
//   } catch (error) {
//     console.error('Error creating checkout session:', error);
//   }
// };

export default function Billing() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user, isLoading } = useAuth();
  const [subscribed, setSubscribed] = useState(null);
  const [products, setProducts] = useState([]);
  const [rewards, setRewards] = useState(0);
  const [withdrawalStatus, setWithdrawalStatus] = useState(null);
  const [nextWithdrawalDate, setNextWithdrawalDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [referralCodes, setReferralCodes] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [iban, setIban] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getActiveSubscription(user);
        setSubscribed(data);
      } catch (err) {
        console.log(err);
      }
      try {
        const rewardsData = await calculateMonthlyRewards(user);
        setRewards(rewardsData?.referralEarnings || 0);
      } catch (err) {
        console.log(err);
      }
      try {
        const withdrawalStatusData = await getWithdrawalStatus(user);
        setWithdrawalStatus(withdrawalStatusData);
        console.log(withdrawalStatusData);
      } catch (err) {
        console.log(err);
      }
      try {
        const nextWithdrawalDateData = await getNextWithdrawalDate(user);
        setNextWithdrawalDate(nextWithdrawalDateData);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, [user?.id]);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (user && user?.referralCode) {
        try {
          const subscriptionDocRef = await getActiveSubscriptionDocRef(user);
          if (subscriptionDocRef) {
            const unsubscribe = onSnapshot(
              subscriptionDocRef,
              (docSnapshot) => {
                const subscriptionData = docSnapshot.data();
                setSubscribed(subscriptionData.status);

                if (
                  subscriptionData.status === 'active' ||
                  subscriptionData.status === 'trialing'
                ) {
                  const referralCodesRef = collection(db, 'referralCodes');
                  const q = query(
                    referralCodesRef,
                    where('code', '==', user.referralCode),
                    where('status', '==', 'registered')
                  );

                  getDocs(q).then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                      updateDoc(doc.ref, {
                        status: 'redeemed',
                      });
                    });
                  });
                }
              }
            );

            return () => unsubscribe();
          }
        } catch (error) {
          console.error('Error fetching subscription:', error);
        }
      }
    };

    fetchSubscription();
  }, [user?.id]);

  useEffect(() => {
    const fetchReferralCodes = async () => {
      const referralCodesRef = collection(db, 'referralCodes');
      try {
        const referralCodesQuery = referralCodesRef.where(
          'userId',
          '==',
          user.id
        );
        const referralCodesSnapshot = await referralCodesQuery.get();

        const referralCodesList = referralCodesSnapshot.docs.map((doc) => {
          return {
            code: doc.data().code,
            status: doc.data().status,
          };
        });

        setReferralCodes(referralCodesList);
      } catch (err) {
        console.error(err);
      }
    };

    fetchReferralCodes();
  }, [user?.id]);

  const manageSubscription = async () => {
    const portalUrl = await getPortalUrl(user);
  };

  const handleWithdrawRequest = async () => {
    if (rewards > 0 && withdrawalStatus !== 'pending') {
      setLoading(true);
      try {
        const userDocRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();

        if (!userData.iban) {
          // Show modal to ask for IBAN
          onOpen();
          setLoading(false); // Stop loading since we're waiting for user input
          return;
        }

        const withdrawalRef = doc(db, 'withdrawals', user.id);
        const withdrawalSnapshot = await getDoc(withdrawalRef);

        // Check if the document exists
        if (withdrawalSnapshot.exists()) {
          // Document exists, update it
          await updateDoc(withdrawalRef, { status: 'pending' });
        } else {
          // Document doesn't exist, create it
          await setDoc(withdrawalRef, {
            userId: user.id,
            userData: user,
            status: 'pending',
            rewards: rewards,
            iban: user.iban,
            month: new Date().getMonth(),
            nextWithdrawalDate: getNextMonthDate(),
          });
        }

        setWithdrawalStatus('pending');
      } catch (error) {
        console.error('Error handling withdrawal request:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (timestamp) => {
    const date = timestamp.toDate(); // Convert Firestore Timestamp to JS Date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  useEffect(() => {
    if (user) {
      const referralCodesRef = collection(db, 'referralCodes');
      const q = query(referralCodesRef, where('userId', '==', user?.id));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const referralCodesList = snapshot.docs.map((doc) => {
          return {
            code: doc.data().code,
            status: doc.data().status,
          };
        });

        setReferralCodes(referralCodesList);
      });

      return unsubscribe;
    }
  }, [user]);

  const generateNewReferralCode = async () => {
    const newReferralCode = await generateReferralCode(user);
    setReferralCodes((prevReferralCodes) => [
      ...prevReferralCodes,
      { code: newReferralCode, status: 'active' },
    ]);
  };

  const handleIbanSubmit = async () => {
    try {
      const userDocRef = doc(db, 'users', user.id);
      await setDoc(userDocRef, { iban }, { merge: true });
      onClose();
      handleWithdrawRequest(); // Retry the withdrawal request after saving IBAN
    } catch (error) {
      console.error('Error updating IBAN:', error);
      Alert({
        title: 'Error',
        description: 'Failed to update IBAN. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Center pt={20} width={isMobile ? '100%' : '100vw'}>
      <VStack spacing={6} align="center">
        {subscribed && (
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color="#1041B2"
            textAlign="center"
          >
            Billing
          </Text>
        )}
        {!subscribed ? (
          <Card align="center" maxW="lg">
            <CardHeader>
              <Image src={logoM} width={100} height={100} ml="auto" mr="auto" />
              <Badge
                position="absolute"
                top="10"
                left={isMobile ? '57%' : '55%'}
                fontSize={isMobile ? '2xs' : 'xs'}
                backgroundColor="orange"
                color={'white'}
                zIndex="1"
              >
                PRO
              </Badge>
              <Heading size="md">
                <HStack>
                  <Text>Upgrade to </Text>
                  <Text color={'orange'} ml={-1}>
                    Pro
                  </Text>
                </HStack>
              </Heading>
            </CardHeader>
            <CardBody>
              <List spacing={3}>
                {benefitsData.map((benefit, index) => (
                  <ListItem key={index} fontWeight={'bold'}>
                    <ListIcon as={FiCheckCircle} color={'orange'} />
                    {benefit}
                  </ListItem>
                ))}
              </List>
            </CardBody>
            <CardFooter>
              <Button
                onClick={() => {
                  CreateCheckout(user);
                  setLoading(true);
                }}
                isLoading={loading}
                loadingText="Loading"
                spinnerPlacement="end"
                color="white"
                backgroundColor="orange"
                _hover={{ backgroundColor: 'orange.500', color: 'white' }}
              >
                {loading ? 'Loading...' : 'Upgrade'}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Box>
            <Lottie animationData={lottieanimation} />
            <Text ml={85}>You are a Pro user</Text>
          </Box>
        )}
        {subscribed && (
          <Button
            onClick={() => {
              manageSubscription();
              setLoading(true);
            }}
            isLoading={loading}
            loadingText="Loading"
            spinnerPlacement="end"
            color="white"
            backgroundColor="orange"
            _hover={{ backgroundColor: 'orange.500', color: 'white' }}
          >
            {loading ? 'Loading...' : 'Manage Subscription'}
          </Button>
        )}
        {withdrawalStatus && (
          <>
            <Text
              fontSize="xl"
              fontWeight="bold"
              color="black"
              textAlign="center"
            >
              Referral Rewards
            </Text>

            <StatGroup>
              <Stat>
                <StatLabel>Rewards</StatLabel>
                <StatNumber>{rewards}</StatNumber>
                <StatHelpText>
                  You have {rewards} rewards available for withdrawal.
                </StatHelpText>
              </Stat>
              {withdrawalStatus === 'pending' ? (
                <Stat>
                  <StatLabel>Withdrawal Status</StatLabel>
                  <StatNumber>Pending</StatNumber>
                  <StatHelpText>
                    Your withdrawal request is pending.
                  </StatHelpText>
                </Stat>
              ) : (
                <Stat>
                  <StatLabel>Next Withdrawal Date</StatLabel>
                  <StatNumber>
                    {nextWithdrawalDate
                      ? formatDate(nextWithdrawalDate)
                      : 'N/A'}
                  </StatNumber>
                  <StatHelpText>
                    You can withdraw again on{' '}
                    {nextWithdrawalDate
                      ? formatDate(nextWithdrawalDate)
                      : 'N/A'}
                    .
                  </StatHelpText>
                </Stat>
              )}
            </StatGroup>
          </>
        )}
        {rewards > 0 && (
          <Button
            onClick={handleWithdrawRequest}
            isLoading={loading}
            loadingText="Loading"
            spinnerPlacement="end"
            color="white"
            backgroundColor="orange"
            _hover={{ backgroundColor: 'orange.500', color: 'white' }}
          >
            {loading ? 'Loading...' : 'Request Withdrawal'}
          </Button>
        )}
        {subscribed && (
          <>
            <Text
              fontSize="xl"
              fontWeight="bold"
              color="black"
              textAlign="center"
            >
              Referral Codes
            </Text>
            <List spacing={3}>
              {referralCodes.map((referralCode, index) => (
                <ListItem key={index} fontWeight={'bold'}>
                  <ListIcon as={FiCheckCircle} color={'orange'} />
                  {referralCode.code} ({referralCode.status})
                  {referralCode.status === 'active' && (
                    <Button
                      onClick={async () => {
                        const referralCodesRef = collection(
                          db,
                          'referralCodes'
                        );
                        const q = query(
                          referralCodesRef,
                          where('code', '==', referralCode.code)
                        );
                        const querySnapshot = await getDocs(q);
                        if (!querySnapshot.empty) {
                          const referralCodeDoc = querySnapshot.docs[0];
                          await updateDoc(referralCodeDoc.ref, {
                            status: 'deleted',
                          });
                          setReferralCodes((prevReferralCodes) =>
                            prevReferralCodes.filter(
                              (code) => code.code !== referralCode.code
                            )
                          );
                        } else {
                          console.log('Document does not exist');
                        }
                      }}
                      color="red"
                      backgroundColor="transparent"
                      _hover={{ backgroundColor: 'red.500', color: 'white' }}
                    >
                      Delete
                    </Button>
                  )}
                </ListItem>
              ))}
            </List>
            <Button
              onClick={generateNewReferralCode}
              color="white"
              backgroundColor="orange"
              _hover={{ backgroundColor: 'orange.500', color: 'white' }}
            >
              Generate New Referral Code
            </Button>
          </>
        )}
      </VStack>
      {/* IBAN Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enter your IBAN</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="IBAN"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleIbanSubmit}>
              Save
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Center>
  );
}
