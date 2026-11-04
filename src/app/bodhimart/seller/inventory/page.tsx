console.log('SELLER DIAGNOSTIC - Profile:', {
  sellerData,
  sellerError,
  expected_user_id: 'cfc9ce6b-3344-4378-9f37-8eaadd7517df',
});

if (sellerError) {
  throw new Error(
    `Seller lookup failed: ${sellerError.message}`
  );
}

if (!sellerData) {
  throw new Error(
    'Seller profile not found for browser user: ' + user.id
  );
}
