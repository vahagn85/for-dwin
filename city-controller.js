import {
  User,
  Cost,
  Comment,
  City,
  CostCategory,
  Comparison,
  Continent,
  CostIndex,
  Country,
  ExchangeRate,
  SubContinent,
} from "../../database/models";
import path from "path";
import formidable from "formidable";
import {
  deleteFile,
  ensureFolder,
  existsFile,
  generetFileName,
  saveFile,
  slugText,
} from "../helpers";

import { Op } from "sequelize";

const getPagination = (_page, _limit) => {
  // heto nayel sarqel henc admin lini limit@ null dnel
  // const limit = _limit ? +_limit : null;
  // const limit = _limit ? +_limit : 100;
  const limit = 25;
  const offset = _page ? _page * limit : 0;

  return { limit, offset };
};
const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: items } = data;
  const currentPage = page ? +page : 0;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, items, totalPages, currentPage };
};

//@desc get all cities by filter
//@route GET /api/city/filter
//@access Public
const getCitiesByFilter = async (req, res) => {
  const { keyword, _page, _limit } = req.query;
  const { limit, offset } = getPagination(_page, _limit);
  if (keyword && keyword.length && keyword !== " " && !_page && !_limit) {
    if (keyword.length > 2) {
      const cities = await City.findAll({
        where: {
          name: {
            [Op.like]: `%${keyword.trim()}%`,
          },
        },
        include: {
          model: Country,
          as: "country",
          attributes: ["name", "slug"],
          include: {
            model: Continent,
            as: "continent",
            attributes: ["slug"],
          },
        },
        attributes: ["id", "name", "slug"],
        limit: 6,
        order: [["name", "ASC"]],
      });
      res.status(200).json({
        status: "success",
        cities,
      });
    } else {
      res.status(404).json({
        status: "fail",
        message: "More value",
      });
      return;
    }

    return;
  } else {
    const cities = await City.findAndCountAll({
      include: {
        model: Country,
        as: "country",
        attributes: ["name", "slug", "iso"],
        include: {
          model: Continent,
          as: "continent",
          attributes: ["slug"],
        },
      },
      attributes: [
        "name",
        "slug",
        "flag_path",
        "avg_salary",
        "area",
        "population",
      ],
      limit,
      offset,
      order: [["name", "ASC"]],
    });
    const response = getPagingData(cities, _page, limit);
    res.status(200).json({
      status: "success",
      response,
    });
    return;
  }
};

//@desc get all cities
//@route GET /api/city
//@access Private
const getCities = async (req, res) => {
  const cities = await City.findAll({
    include: {
      model: Country,
      as: "country",
      attributes: ["name", "slug"],
      include: {
        model: Continent,
        as: "continent",
        attributes: ["slug"],
      },
    },
    attributes: [
      "id",
      "name",
      "slug",
      "photo_path",
      "flag_path",
      "created_at",
      "updated_at",
    ],
    order: [["id", "DESC"]],
  });
  res.status(200).json({
    status: "success",
    cities,
  });
  return;
};

//@desc create a city
//@route POST /api/city
//@access Private
const createCity = async (req, res) => {
  const d = new Date();
  let year = d.getFullYear();
  let month = d.getMonth();
  const options = {
    maxFileSize: 1.9 * 1024 * 1024, //1900kb
    allowEmptyFiles: false,
    filename: function (name, ext, part, form) {
      return `${generetFileName(name)}${ext}`;
    },
    keepExtensions: true,
    filter: function ({ name, originalFilename, mimetype }) {
      // keep only images
      return mimetype && mimetype.includes("image");
    },
    // uploadDir: `${process.cwd()}/public/uploads/blog/${year}/${month + 1}`,
  };

  const form = new formidable.IncomingForm(options);

  form.parse(req, async function (err, fields, files) {
    try {
      if (err) {
        console.log("Error parsing the files", 222);
        return res.status(400).json({
          status: "Fail",
          message: "There was an error parsing the files",
          error: err,
        });
      }
      if (files?.city_img) {
        const folderPath = `uploads/city/${year}/${month + 1}`;
        const uploadFolder = `${process.cwd()}/public/${folderPath}`;
        const {
          name,
          founded,
          desc,
          population,
          area,
          avg_salary,
          elevation,
          timezone,
          country_id,
          exchange_id,
        } = fields;
        const city = await City.create({
          name,
          slug: slugText(name),
          photo_path: `${folderPath}/${files?.city_img?.newFilename}`,
          flag_path: files?.flag_img
            ? `${folderPath}/${files?.flag_img?.newFilename}`
            : undefined,
          founded,
          desc,
          population,
          area,
          avg_salary,
          elevation,
          timezone,
          country_id,
          exchange_id,
        });

        await ensureFolder(uploadFolder, true);
        await saveFile(files.city_img, uploadFolder);
        if (files?.flag_img) {
          await saveFile(files.flag_img, uploadFolder);
        }
        return res.status(201).json({
          status: "success",
          city,
        });
      } else {
        return res.status(400).json({
          status: "Fail",
          message: "Please upload image",
        });
      }
    } catch (err) {
      let errSeq = null;

      if (err.errors && err.length !== 0) {
        errSeq = err.errors.map((i) => ({
          type: i.path,
          message: i.message,
        }));
      }
      return res.status(404).json({
        status: "Fail",
        message: "Something is wrong",
        errors: errSeq,
        err: process.env.NODE_ENV === "production" ? null : err,
      });
    }
  });
};

//@desc Get a city by slug
//@route GET /api/city/:slug
//@access Private
const getCityBySlug = async (req, res) => {
  const { slug, type, counrty, continent } = req.query;
  let city;
  if (type === "front") {
    city = await City.findOne({
      include: [
        {
          model: CostIndex,
          as: "cost_index",
          attributes: [
            "living",
            "rent",
            "living_plus",
            "groceries",
            "restaurant",
            "purchasing",
          ],
        },
        {
          model: Country,
          as: "country",
          where: { slug: counrty ? counrty : "" },
          attributes: ["name", "slug", "iso", "currency"],
          include: {
            model: Continent,
            as: "continent",
            where: { slug: continent ? continent : "" },
            attributes: ["name", "slug"],
          },
        },
        {
          model: ExchangeRate,
          as: "exchange",
          attributes: { exclude: ["id"] },
        },
        {
          model: Comment,
          as: "comments",
          separate: true,
          where: {
            status: "active",
          },
          attributes: ["name", "content", "updated_at"],
          order: [["updated_at", "DESC"]],
        },
      ],
      attributes: {
        exclude: ["country_id", "exchange_id"],
      },
      where: {
        slug: slug,
      },
    });
  } else {
    city = await City.findOne({
      where: {
        slug: slug,
      },
    });
  }

  if (!city) {
    return res.status(404).json({
      status: "fail",
      message: "City Not Found",
    });
  }
  let cityCosts;
  if (type === "front") {
    cityCosts = await CostCategory.findAll({
      include: {
        model: Cost,
        as: "category_costs",
        separate: true,
        where: {
          city_id: city.id,
        },
        attributes: { exclude: ["city_id", "category_id"] },
        order: [["item_name", "ASC"]],
      },
      order: [["sort", "ASC"]],
    });
  }
  return res.json({
    status: "success",
    costs: cityCosts,
    city,
  });
};

//@desc update a city by id
//@route PUT /api/city/:id
//@access Private
const updateCityById = async (req, res) => {
  const d = new Date();
  let year = d.getFullYear();
  let month = d.getMonth();
  const optionsUpdate = {
    maxFileSize: 1.9 * 1024 * 1024, //1900kb
    allowEmptyFiles: false,
    filename: function (name, ext, part, form) {
      return `${generetFileName(name)}${ext}`;
    },
    keepExtensions: true,
    filter: function ({ name, originalFilename, mimetype }) {
      // keep only images
      return mimetype && mimetype.includes("image");
    },
    // uploadDir: `${process.cwd()}/public/uploads/blog/${year}/${month + 1}`,
  };
  const { slug } = req.query;

  const city = await City.findOne({
    where: { id: slug },
  });
  if (city) {
    const formUpdate = new formidable.IncomingForm(optionsUpdate);

    formUpdate.parse(req, async function (err, fields, files) {
      try {
        if (err) {
          console.log("Error parsing the files", 222);
          return res.status(400).json({
            status: "Fail",
            message: "There was an error parsing the files",
            error: err,
          });
        }
        const folderPath = `uploads/city/${year}/${month + 1}`;
        const uploadFolder = `${process.cwd()}/public/${folderPath}`;
        const {
          name,
          founded,
          desc,
          population,
          area,
          avg_salary,
          elevation,
          timezone,
          country_id,
          exchange_id,
        } = fields;
        if (name) {
          city.name = name;
        }
        if (founded) {
          city.founded = founded;
        }
        if (desc) {
          city.desc = desc;
        }
        if (population) {
          city.population = population;
        }
        if (area) {
          city.area = area;
        }
        if (avg_salary) {
          city.avg_salary = avg_salary;
        }
        if (elevation) {
          city.elevation = elevation;
        }
        if (timezone) {
          city.timezone = timezone;
        }
        if (country_id) {
          city.country_id = country_id;
        }
        if (exchange_id) {
          city.exchange_id = exchange_id;
        }
        if (files?.city_img) {
          const fileOld = path.join(process.cwd(), "public", city.photo_path);
          const isFile = await existsFile(fileOld);
          if (isFile) {
            await deleteFile(fileOld);
          }
          city.photo_path = `${folderPath}/${files?.city_img?.newFilename}`;
          await ensureFolder(uploadFolder, true);
          await saveFile(files.city_img, uploadFolder);
        }

        if (files?.flag_img) {
          if (city?.flag_path) {
            const fileOld = path.join(process.cwd(), "public", city.flag_path);
            const isFile = await existsFile(fileOld);
            if (isFile) {
              await deleteFile(fileOld);
            }
          }
          city.flag_path = `${folderPath}/${files?.flag_img?.newFilename}`;
          await ensureFolder(uploadFolder, true);
          await saveFile(files.flag_img, uploadFolder);
        }
        const updatedCity = await city.save();

        return res.status(200).json({
          status: "success",
          updatedCity,
        });
      } catch (err) {
        let errSeq = null;
        if (err.errors && err.length !== 0) {
          errSeq = err.errors.map((i) => ({
            type: i.path,
            message: i.message,
          }));
        }
        return res.status(404).json({
          status: "Fail",
          message: "Something is wrong",
          errors: errSeq,
          err: process.env.NODE_ENV === "production" ? null : err,
        });
      }
    });
  } else {
    res.status(404);
    throw new Error("City not found");
  }
};
//@desc Delete a city by id
//@route DELETE /api/city/:id
//@access Private
const deleteCityById = async (req, res) => {
  const { slug } = req.query;
  const city = await City.findOne({
    where: {
      id: slug,
    },
  });
  if (city) {
    await City.destroy({
      where: { id: slug },
    });
    if (city.photo_path) {
      const fileOld = path.join(process.cwd(), "public", city.photo_path);
      const isFile = await existsFile(fileOld);
      if (isFile) {
        await deleteFile(fileOld);
      }
    }
    if (city.flag_path) {
      const fileOld = path.join(process.cwd(), "public", city.flag_path);
      const isFile = await existsFile(fileOld);
      if (isFile) {
        await deleteFile(fileOld);
      }
    }
    return res.json({
      status: "success",
      message: "City deleted",
    });
  } else {
    res.status(404);
    throw new Error("City not found");
  }
};
export {
  getCities,
  getCitiesByFilter,
  createCity,
  getCityBySlug,
  updateCityById,
  deleteCityById,
};
