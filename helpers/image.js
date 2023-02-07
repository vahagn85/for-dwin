import slugify from "slugify";
import { customAlphabet } from "nanoid";
export const generetFileName = (photo) => {
  // let photoName = photo.split(".");
  // const ext = photoName.pop();
  // let newPhotoName = photoName.join("-");
  const nanoid = customAlphabet("1234567890aeioubcdfghjklmnpqrstvxz", 5);
  // ${path.extname(file.originalname)}
  // return `${slugify(photo, {
  //   replacement: "-",
  //   lower: true,
  //   remove: /[*+~.()'"!:@?]/g,
  //   local: "en",
  //   trim: true,
  // })}-${nanoid()}.${ext}`;
  return `${slugify(photo, {
    replacement: "-",
    lower: true,
    remove: /[*+~.()'"!:@?]/g,
    local: "en",
    trim: true,
  })}-${nanoid()}`;
};
