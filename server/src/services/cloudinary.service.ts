import cloudinary from "../config/cloudinary";

// UPLOAD IMAGE TO CLOUDINARY
export const uploadToCloudinary = (
  fileBuffer: Buffer,
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "mototrack",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Image upload failed"));
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    uploadStream.end(fileBuffer);
  });
};

// DELETE IMAGE FROM CLOUDINARY
export const deleteFromCloudinary = (publicId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: "image" },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (result?.result !== "ok" && result?.result !== "not found") {
          return reject(new Error("Image deletion failed"));
        }

        resolve();
      },
    );
  });
};
