export type CropProfile = {
  id: string;
  name: string;
  scientificName: string;
  family: string;
  biologicalLifecycle: "Annual" | "Perennial";
  fieldManagementCycle: "Short-cycle" | "Long-term planting";
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
    biologicalLifecycle: "Perennial",
    fieldManagementCycle: "Long-term planting",
    role: "Root and tuber crop",
    rotationNote: "A long-duration crop. Do not treat it as a routine short-cycle slot; account for field occupancy and local pest and disease history.",
    localValidation: "Cultivar, planting date, harvest age and local disease pressure need confirmation."
  },
  {
    id: "maize",
    name: "Maize",
    scientificName: "Zea mays",
    family: "Poaceae",
    biologicalLifecycle: "Annual",
    fieldManagementCycle: "Short-cycle",
    role: "Cereal",
    rotationNote: "A grass-family cereal. A following crop from a different botanical family can diversify the sequence, but suitability depends on soil, rainfall and management.",
    localValidation: "Select locally adapted varieties and verify planting window and water availability."
  },
  {
    id: "common-bean",
    name: "Common bean",
    scientificName: "Phaseolus vulgaris",
    family: "Fabaceae",
    biologicalLifecycle: "Annual",
    fieldManagementCycle: "Short-cycle",
    role: "Grain legume",
    rotationNote: "A legume. Do not assume nitrogen benefit without considering nodulation, inoculation, residue management and actual field conditions.",
    localValidation: "Confirm locally suitable varieties, disease risks and planting window."
  },
  {
    id: "groundnut",
    name: "Groundnut",
    scientificName: "Arachis hypogaea",
    family: "Fabaceae",
    biologicalLifecycle: "Annual",
    fieldManagementCycle: "Short-cycle",
    role: "Oilseed legume",
    rotationNote: "A legume in the same botanical family as common bean. Consecutive legume crops are not automatically a diverse rotation.",
    localValidation: "Soil drainage, seed quality, disease history and harvest conditions require local assessment."
  },
  {
    id: "sweet-potato",
    name: "Sweet potato",
    scientificName: "Ipomoea batatas",
    family: "Convolvulaceae",
    biologicalLifecycle: "Perennial",
    fieldManagementCycle: "Short-cycle",
    role: "Root crop, commonly managed as a short-cycle crop",
    rotationNote: "Often managed as a short-cycle field crop despite its perennial biological capacity. The local production cycle, planting material and pest and disease history must be confirmed.",
    localValidation: "Confirm locally used varieties, planting material health and actual field duration."
  },
  {
    id: "banana",
    name: "Banana",
    scientificName: "Musa spp.",
    family: "Musaceae",
    biologicalLifecycle: "Perennial",
    fieldManagementCycle: "Long-term planting",
    role: "Fruit crop",
    rotationNote: "A perennial planting system. Model it as a long-term field occupation rather than a routine short-cycle rotation slot.",
    localValidation: "Cultivar, water supply, soil drainage and disease status need local assessment."
  }
];
