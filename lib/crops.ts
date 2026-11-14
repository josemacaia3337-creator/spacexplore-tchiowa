export type CropProfile = {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  type: "Annual" | "Perennial";
  role: string;
  rotationNote: string;
  localValidation: string;
};

export const cropProfiles: CropProfile[] = [
  {
    id: "cassava",
    name: "Cassava",
    scientificName: "Manihot esculenta",
    family: "Euphorbiaceae",
    type: "Perennial",
    role: "Root and tuber crop",
    rotationNote: "A long-duration crop. Avoid treating it as a simple short-season annual in rotation plans; account for the time it occupies the field and local pest and disease history.",
    localValidation: "Cultivar, planting date, harvest age and local disease pressure need confirmation."
  },
  {
    id: "maize",
    name: "Maize",
    scientificName: "Zea mays",
    family: "Poaceae",
    type: "Annual",
    role: "Cereal",
    rotationNote: "A grass-family cereal. A following crop from a different botanical family can diversify the sequence, but suitability depends on soil, rainfall and management.",
    localValidation: "Select locally adapted varieties and verify planting window and water availability."
  },
  {
    id: "common-bean",
    name: "Common bean",
    scientificName: "Phaseolus vulgaris",
    family: "Fabaceae",
    type: "Annual",
    role: "Grain legume",
    rotationNote: "A legume. Do not assume nitrogen benefit without considering nodulation, inoculation, residue management and actual field conditions.",
    localValidation: "Confirm locally suitable varieties, disease risks and planting window."
  },
  {
    id: "groundnut",
    name: "Groundnut",
    scientificName: "Arachis hypogaea",
    family: "Fabaceae",
    type: "Annual",
    role: "Oilseed legume",
    rotationNote: "A legume in the same botanical family as common bean. Consecutive legume crops are not automatically a diverse rotation.",
    localValidation: "Soil drainage, seed quality, disease history and harvest conditions require local assessment."
  },
  {
    id: "sweet-potato",
    name: "Sweet potato",
    scientificName: "Ipomoea batatas",
    family: "Convolvulaceae",
    type: "Perennial",
    role: "Root crop, commonly managed as an annual",
    rotationNote: "Usually managed as a short-cycle crop, but planting material and local pest and disease history matter when selecting the next crop.",
    localValidation: "Confirm locally used varieties, planting material health and crop duration."
  },
  {
    id: "banana",
    name: "Banana",
    scientificName: "Musa spp.",
    family: "Musaceae",
    type: "Perennial",
    role: "Fruit crop",
    rotationNote: "A perennial planting. It is generally better modelled as a long-term planting system than as a routine annual rotation slot.",
    localValidation: "Cultivar, water supply, soil drainage and disease status need local assessment."
  }
];
