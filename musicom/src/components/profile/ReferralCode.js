import React, { useState } from 'react';
import { Button, Text, Box } from '@chakra-ui/react';
import { updateUserProfile } from "lib/firebase";

const generateReferralCode = (length = 8) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const ReferralCodeGenerator = () => {
  const [referralCode, setReferralCode] = useState('');

  const handleGenerateCode = async () => {
    const code = generateReferralCode();
    setReferralCode(code);
    // Save the generated code to the user's profile
    await updateUserProfile({ referralCode: code });
  };

  return (
    <Box>
      <Button onClick={handleGenerateCode} colorScheme="blue">Generate Referral Code</Button>
      {referralCode && <Text mt="4">Your Referral Code: {referralCode}</Text>}
    </Box>
  );
};

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const generateStripePromotionCode = async (referralCode) => {
    
    const coupon = await stripe.coupons.create({
        percent_off: 20, // percentage of discount
        duration: 'once', // how many times it can be used
    });

    // Create a promotion code using the coupon and referral code
    const promotionCode = await stripe.promotionCodes.create({
        coupon: coupon.id,
        code: referralCode.toUpperCase(), // Assuming referral codes are unique and uppercase
    });

    return promotionCode;
};

export default ReferralCodeGenerator;
