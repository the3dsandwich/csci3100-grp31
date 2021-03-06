import React, { useState, useEffect } from "react";
import { Input, Button, Progress, FormGroup, Label } from "reactstrap";
import { uploadProfileImage } from "../../utilityfunctions/Utilities";

const EditProfileImage = () => {
  // file object to be uploaded
  const [imageFile, setImageFile] = useState();
  // 0~100, will be updated by uploadProfileImage()
  const [uploadProgress, setUploadProgress] = useState();

  // reset when progress >= 100 and removes input image
  useEffect(() => {
    if (uploadProgress >= 100) {
      alert("Upload complete!");
      setImageFile(null);
      setUploadProgress(0);
    }
  }, [uploadProgress]);

  const handleProfileImageInputChange = (e) => setImageFile(e.target.files[0]);

  // invokes uploadProfileImage() to upload imageFile if present
  const handleProfileImageUpload = (e) => {
    e.preventDefault();
    if (imageFile) {
      uploadProfileImage({ imageFile, setUploadProgress });
    }
  };

  // render
  return (
    <FormGroup>
      <Label for="profile_image">Profile Image</Label>
      <Input
        id="profile_image"
        accept="image/x-png,image/gif,image/jpeg"
        type="file"
        onChange={handleProfileImageInputChange}
      />
      <br />
      <Button block size="sm" color="info" onClick={handleProfileImageUpload}>
        <i className="fas fa-upload"></i> Upload
      </Button>
      <br />
      <Progress color="info" value={uploadProgress} />
    </FormGroup>
  );
};

export default EditProfileImage;
