// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Button,
//   Center,
//   Flex,
//   Text,
//   VStack,
//   useBreakpointValue,
//   Stat,
//   StatLabel,
//   StatNumber,
//   StatGroup,
//   RadioGroup,
//   Stack,
//   Radio,
//   Grid,
//   GridItem,
//   Icon,
// } from "@chakra-ui/react";
// import { useAuth } from "hooks/auth";
// import { collection, getDocs, query, where } from "firebase/firestore";
// import { db } from "lib/firebase";
// import * as XLSX from "xlsx";
// import { Bar, Pie } from "react-chartjs-2";
// import { Chart as ChartJS } from "chart.js/auto";
// import { saveAs } from "file-saver";
// import { FaBusinessTime, FaStar, FaUsers } from "react-icons/fa";

// const getActiveSubscription = async (user) => {
//   try {
//     const snapshot = await getDocs(
//       query(
//         collection(
//           db,
//           user?.businessName ? "businesses" : "users",
//           user?.id,
//           "subscriptions"
//         ),
//         where("status", "in", ["trialing", "active"])
//       )
//     );

//     if (snapshot.docs.length > 0) {
//       const doc = snapshot.docs[0];
//       return doc.data().status;
//     } else {
//       console.log("No active or trialing subscription found.");
//       return null;
//     }
//   } catch (error) {
//     console.error("Error getting active subscription:", error);
//     throw error;
//   }
// };

// export default function AdminPanel() {
//   const { user } = useAuth();
//   const isMobile = useBreakpointValue({ base: true, md: false });

//   const [data, setData] = useState({
//     totalUsers: 0,
//     totalBusinesses: 0,
//     totalPremiumUsers: 0,
//     instruments: [],
//     roles: [],
//   });

//   const [chartType, setChartType] = useState("bar");

//   useEffect(() => {
//     if (user?.isAdmin) {
//       fetchUserData();
//     }
//   }, [user]);

//   const fetchUserData = async () => {
//     const usersRef = collection(db, "users");
//     const usersSnapshot = await getDocs(usersRef);

//     const totalUsers = usersSnapshot.docs.length;
//     let totalPremiumUsers = 0;
//     const businessesRef = collection(db, "businesses");
//     const businessesSnapshot = await getDocs(businessesRef);

//     const totalBusinesses = businessesSnapshot.docs.length;

//     let instruments = {};
//     let roles = {};

//     for (let doc of usersSnapshot.docs) {
//       const userData = doc.data();
//       const subscriptionData = await getActiveSubscription(userData);
//       if (subscriptionData) {
//         totalPremiumUsers++;
//       }

//       userData.instrument?.forEach((instrument) => {
//         instruments[instrument] = (instruments[instrument] || 0) + 1;
//       });

//       const role = userData.role;
//       roles[role] = (roles[role] || 0) + 1;
//     }

//     setData({
//       totalUsers,
//       totalBusinesses,
//       totalPremiumUsers,
//       instruments: sortAndFormatDataForChart(instruments),
//       roles: sortAndFormatDataForChart(roles),
//     });
//   };

//   const sortAndFormatDataForChart = (dataObj) => {
//     return Object.entries(dataObj).sort((a, b) => b[1] - a[1]);
//   };

//   const downloadExcel = () => {
//     const ws = XLSX.utils.json_to_sheet([
//       { category: "Total Users", count: data.totalUsers },
//       { category: "Total Businesses", count: data.totalBusinesses },
//       ...data.instruments.map(([key, value]) => ({
//         category: `Instrument: ${key}`,
//         count: value,
//       })),
//       ...data.languages.map(([key, value]) => ({
//         category: `Language: ${key}`,
//         count: value,
//       })),
//       ...data.roles.map(([key, value]) => ({
//         category: `Role: ${key}`,
//         count: value,
//       })),
//     ]);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Data");

//     // Use xlsx.write to generate binary string and then trigger a browser download
//     const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
//     function s2ab(s) {
//       const buf = new ArrayBuffer(s.length);
//       const view = new Uint8Array(buf);
//       for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
//       return buf;
//     }
//     saveAs(
//       new Blob([s2ab(wbout)], { type: "application/octet-stream" }),
//       "AdminPanelData.xlsx"
//     );
//   };

//   const getChartData = (dataEntries) => ({
//     labels: dataEntries.map(([key]) => key),
//     datasets: [
//       {
//         data: dataEntries.map(([, value]) => value),
//         backgroundColor: [
//           "rgba(255, 99, 132, 0.5)",
//           "rgba(54, 162, 235, 0.5)",
//           "rgba(255, 206, 86, 0.5)",
//           "rgba(75, 192, 192, 0.5)",
//           "rgba(153, 102, 255, 0.5)",
//           "rgba(255, 159, 64, 0.5)",
//         ],
//         label: "",
//       },
//     ],
//   });

//   const renderChart = (dataEntries, chartTitle) => {
//     const ChartComponent = chartType === "bar" ? Bar : Pie;
//     const chartData = getChartData(dataEntries);

//     return (
//       <>
//         <Text mb={4}>{chartTitle}</Text>
//         <ChartComponent data={chartData} />
//       </>
//     );
//   };
//   const StatCard = ({ icon, title, value }) => (
//     <Box
//       p={5}
//       shadow="md"
//       borderWidth="1px"
//       borderRadius="md"
//       display="flex"
//       alignItems="center"
//       justifyContent="space-between"
//       bg="white"
//     >
//       <Icon as={icon} w={8} h={8} color="blue.500" />
//       <Box>
//         <Text fontSize="xl" fontWeight="bold">
//           {value}
//         </Text>
//         <Text fontSize="md" color="gray.600">
//           {title}
//         </Text>
//       </Box>
//     </Box>
//   );

//   return (
//     <Center pt={20} width={isMobile ? "100%" : "100vw"}>
//       <VStack spacing={6} align="center">
//         {user?.isAdmin && (
//           <>
//             <Text
//               fontSize="2xl"
//               fontWeight="bold"
//               color="#1041B2"
//               textAlign="center"
//             >
//               Admin Panel
//             </Text>
//             <Grid templateColumns="repeat(3, minmax(250px, 1fr))" gap={6}>
//               <GridItem>
//                 <StatCard
//                   icon={FaUsers}
//                   title="Total Users"
//                   value={data.totalUsers}
//                 />
//               </GridItem>
//               <GridItem>
//                 <StatCard
//                   icon={FaStar}
//                   title="Total Premium Users"
//                   value={data.totalPremiumUsers}
//                 />
//               </GridItem>
//               <GridItem>
//                 <StatCard
//                   icon={FaBusinessTime}
//                   title="Total Businesses"
//                   value={data.totalBusinesses}
//                 />
//               </GridItem>
//             </Grid>
//             <RadioGroup onChange={setChartType} value={chartType}>
//               <Stack direction="row" mb={4}>
//                 <Radio value="bar">Bar Chart</Radio>
//                 <Radio value="pie">Pie Chart</Radio>
//               </Stack>
//             </RadioGroup>
//             <Flex direction={isMobile ? "column" : "row"} gap={6} width="full">
//               <Box
//                 p={5}
//                 shadow="md"
//                 borderWidth="1px"
//                 borderRadius="md"
//                 width="full"
//               >
//                 {renderChart(data.instruments, "Trending Instruments")}
//               </Box>
//               <Box
//                 p={5}
//                 shadow="md"
//                 borderWidth="1px"
//                 borderRadius="md"
//                 width="full"
//               >
//                 {renderChart(data.roles, "Trending Roles")}
//               </Box>
//             </Flex>
//             <Button colorScheme="blue" onClick={downloadExcel}>
//               Download Data
//             </Button>
//           </>
//         )}
//       </VStack>
//     </Center>
//   );
// }

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
  ButtonGroup,
  Image,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  StatArrow,
  Badge,
} from "@chakra-ui/react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "hooks/auth";
import { app, db } from "lib/firebase";
import { useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { router } from "lib/routes";
import { FiCheckCircle } from "react-icons/fi";

const AdminWithdrawals = () => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user, isLoading } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      const withdrawalsRef = collection(db, "withdrawals");
      const q = query(withdrawalsRef, where("status", "==", "pending"));
      const querySnapshot = await getDocs(q);

      const withdrawalsArray = [];
      querySnapshot.forEach((doc) => {
        withdrawalsArray.push({ id: doc.id, ...doc.data() });
      });

      setWithdrawals(withdrawalsArray);
    };

    fetchWithdrawals();
  }, []);

  const handleApproveWithdrawal = async (withdrawalId) => {
    setLoading(true);
    try {
      const withdrawalRef = doc(db, "withdrawals", withdrawalId);
      await updateDoc(withdrawalRef, { status: "completed" });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center pt={20} width={isMobile ? "100%" : "100vw"}>
      <VStack spacing={6} align="center">
        <Text
          fontSize="2xl"
          fontWeight="bold"
          color="#1041B2"
          textAlign="center"
        >
          Admin Withdrawals
        </Text>
        <Card align="center" maxW="lg">
          <CardHeader>
            <Heading size="md">Pending Withdrawals</Heading>
          </CardHeader>
          <CardBody>
            <List spacing={3}>
              {withdrawals.map((withdrawal, index) => (
                <ListItem key={index} fontWeight={"bold"}>
                  <ListIcon as={FiCheckCircle} color={"orange"} />
                  {withdrawal.userId} - {withdrawal.amount}
                </ListItem>
              ))}
            </List>
          </CardBody>
          <CardFooter>
            <ButtonGroup spacing={4}>
              {withdrawals.map((withdrawal) => (
                <Button
                  key={withdrawal.id}
                  onClick={() => handleApproveWithdrawal(withdrawal.id)}
                  isLoading={loading}
                  loadingText="Loading"
                  spinnerPlacement="end"
                  color="white"
                  backgroundColor="orange"
                  _hover={{ backgroundColor: "orange.500", color: "white" }}
                >
                  {loading ? "Loading..." : "Approve"}
                </Button>
              ))}
            </ButtonGroup>
          </CardFooter>
        </Card>
      </VStack>
    </Center>
  );
};

export default AdminWithdrawals;
