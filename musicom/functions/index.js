const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.calculateMonthlyRewards = functions.pubsub
    .schedule("0 0 1 * *")
    .timeZone("Europe/London")
    .onRun(async (context) => {
      try {
        const usersSnapshot = await admin.firestore().collection("users").get();

        usersSnapshot.forEach(async (userDoc) => {
          const userData = userDoc.data();
          const referralCodes = userData.referralCodes || [];

          // Get the user's withdrawal document
          const withdrawalRef = admin
              .firestore()
              .collection("withdrawals")
              .where("userId", "==", userData.id);
          const withdrawalSnapshot = await withdrawalRef.get();

          // If the user has not withdrawn this month, calculate rewards
          if (
            !withdrawalSnapshot.exists ||
     withdrawalSnapshot.data().month !== context.timestamp.month
          ) {
            // Check subscription status for the user
            const subscriptionStatus = await getActiveSubscription(userDoc);

            if (subscriptionStatus.subscribed) {
              // User is subscribed, award referral earnings
              let totalEarnings = 0;
              for (const referralCode of referralCodes) {
                const referralQuery = await admin
                    .firestore()
                    .collection("users")
                    .where("referralCode", "==", referralCode)
                    .get();

                if (!referralQuery.empty) {
                  const referrer = referralQuery.docs[0];
                  const referrerRef = referrer.ref;
                  const referrerData = referrer.data();

                  // Check if the referrer is a premium user
                  const referrerSubscriptionStatus = await getActiveSubscription(
                      referrerRef,
                  );
                  if (referrerSubscriptionStatus.subscribed) {
                    const currentEarnings = referrerData.referralEarnings || 0;

                    await referrerRef.update({
                      referralEarnings: currentEarnings + 3, // Assuming each referral gives 3 units of earnings
                    });

                    totalEarnings += 3;
                  }
                }
              }

              // Update user's rewards
              await userDoc.ref.update({
                rewards: admin.firestore.FieldValue.increment(totalEarnings),
              });

              // Create or update the user's withdrawal document
              await withdrawalRef.set({
                month: context.timestamp.month,
                rewards: totalEarnings,
              });
            }
          }
        });
      } catch (error) {
        console.error("Error calculating monthly rewards:", error);
      }
    });

const getActiveSubscription = async (userRef) => {
  try {
    const subscriptionRef = userRef.collection("subscriptions");

    const snapshot = await subscriptionRef
        .where("status", "in", ["trialing", "active"])
        .get();

    if (snapshot.docs.length > 0) {
      const doc = snapshot.docs[0];
      const subscriptionData = doc.data();
      return { subscribed: true, status: subscriptionData.status };
    } else {
      console.log("No active or trialing subscription found.");
      return { subscribed: false, status: null };
    }
  } catch (error) {
    console.error("Error checking subscription status:", error);
    throw new functions.https.HttpsError(
        "internal",
        "An error occurred while checking subscription status.",
    );
  }
};
