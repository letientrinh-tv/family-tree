import os
import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", ""),
    api_key=os.getenv("CLOUDINARY_API_KEY", ""),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", ""),
)


def upload_image(file_bytes: bytes, folder: str = "family-tree") -> str:
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        resource_type="image",
    )
    return result["secure_url"]


def delete_image_by_url(url: str):
    if not url or "cloudinary.com" not in url:
        return
    try:
        # Extract public_id from URL: .../upload/v123/folder/filename.ext
        parts = url.split("/upload/")
        if len(parts) == 2:
            public_id = parts[1].rsplit(".", 1)[0]
            # Remove version prefix vXXXXXX/
            if "/" in public_id and public_id.split("/")[0].startswith("v"):
                public_id = "/".join(public_id.split("/")[1:])
            cloudinary.uploader.destroy(public_id)
    except Exception:
        pass
