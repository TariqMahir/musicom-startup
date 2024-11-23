import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "@firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "@firebase/storage";
import { uuidv4 } from "@firebase/util";
import { db, storage } from "lib/firebase";
import { useState, useEffect } from "react";
import { useAuth } from "./auth";

export function usePortfolio(userId) {
  const [portfolio, setPortfolio] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch portfolio data from the database and update the state
    const fetchPortfolio = async () => {
      try {
        const userDocRef = doc(db, "users", userId);
        const userDocSnapshot = await getDoc(userDocRef);

        if (!userDocSnapshot.exists()) {
          return;
        }

        const portfolioData = userDocSnapshot.data().portfolio;
        const portfolioItems = portfolioData.map((data) => {
          const description = data.description || "";
          const names = data.name || [];
          const urls = data.url || [];
          const ids = data.ids || [];

          return {
            description: description,
            name: names || [],
            ids: ids || [],
            url: urls || [],
          };
        });

        setPortfolio(portfolioItems);
      } catch (error) {
        console.error("Error fetching portfolio:", error);
      }
    };

    // Fetch portfolio data when the userId changes
    if (userId) {
      fetchPortfolio();
    }

    // No cleanup function needed here
  }, [userId]);

  const updatePortfolioInDatabase = async (updatedPortfolio) => {
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        portfolio: updatedPortfolio,
      });
      setPortfolio(updatedPortfolio); // Update the portfolio state
    } catch (error) {
      console.error("Error updating portfolio:", error);
    }
  };

  const handleDeleteFile = async (fileToDelete) => {
    try {
      const storageRef = ref(
        storage,
        `portfolios/${user.id}/${fileToDelete.id}`
      );
      // Delete the file from storage
      await deleteObject(storageRef);

      // Delete the file URL from Firestore
      const updatedPortfolio = portfolio.map((item) => {
        if (item.urls) {
          return {
            ...item,
            urls: item.urls.filter((url) => url !== fileToDelete.urls),
            names: item.names.filter((name) => name !== fileToDelete.names),
            ids: item.ids.filter((id) => id !== fileToDelete.ids),
          };
        } else {
          return item;
        }
      });
      await updatePortfolioInDatabase(updatedPortfolio);
    } catch (error) {
      console.error("Error deleting file:", error);

      throw error; // Re-throw the error to handle it in the calling function
    }
  };

  const handleDeleteFiles = async (filesToDelete) => {
    if (filesToDelete) {
      try {
        for (const fileToDelete of filesToDelete) {
          const storageRef = ref(
            storage,
            `portfolios/${user.id}/${fileToDelete}`
          );

          // Delete the file from storage
          await deleteObject(storageRef);
        }
      } catch (error) {
        console.error("Error deleting files:", error);
        throw error;
      }
    }
  };

  return {
    portfolio,
    updatePortfolioInDatabase,
    handleDeleteFile,
    handleDeleteFiles,
  };
}

export function useUploadPortfolio() {
  const [isLoading, setLoading] = useState(false);
  const { user } = useAuth();

  async function uploadFiles(files) {
    setLoading(true);
    const uploadedFiles = [];

    try {
      const userRef = doc(db, "users", user.id);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const updatedPortfolio = userData?.portfolio || []; // Initialize as an empty array if userData.portfolio is null or undefined

      for (const file of files) {
        const fileId = uuidv4();
        const fileRef = ref(storage, `portfolios/${user.id}/${fileId}`);
        await uploadBytes(fileRef, file);

        const downloadURL = await getDownloadURL(fileRef);
        const newPortfolioItem = {
          id: fileId,
          url: downloadURL,
          name: file.name,
          ids: fileId,
        };
        updatedPortfolio.push(newPortfolioItem);
        uploadedFiles.push(newPortfolioItem);
      }

      // Update the portfolio field in the user document
      await updateDoc(userRef, {
        portfolio: updatedPortfolio,
      });
    } catch (error) {
      console.error("Error uploading files:", error);
    }

    setLoading(false);
    return uploadedFiles;
  }

  return { uploadFiles, isLoading };
}
