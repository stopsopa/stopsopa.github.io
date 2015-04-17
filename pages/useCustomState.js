import useFirebase from "./databases/firebase/useFirebase.js";

/**
 * This represents universal custom state interface which at the moment is based on firebase
 * but it might be based on anything really what is able to store tree like structures
 * as long as it provides basic methods:
 * set, get, del
 */
export default ({ section }) => {
  if (typeof section !== "string") {
    throw new Error(`useCustemState error: section is not a string`);
  }

  const { firebase, user, ...rest } = useFirebase({
    section,
  });

  rest.id = user;

  return rest;
};
