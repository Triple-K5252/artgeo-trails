// src/data/questionBank.js
// Built from actual ArcGIS attribute table values in Tourism_Subcounty_Final
// Fields used for scoring: Best_For, Experience_Type, Art_Focus, Main_Attraction,
//                          Target_Audience, Photography_Score, Budget_Level
// Add this at the top of questionBank.js before the categories
export const audienceOptions = [
  { label: "Travelling Solo", value: "Solo Travelers" },
  { label: "With Family", value: "Families" },
  { label: "With Partner / Couple", value: "Couples" },
  { label: "With Friends / Youth Group", value: "Youth" },
  { label: "Senior Traveller", value: "Senior Travelers" },
  { label: "Remote Worker / Bleisure", value: "Remote Workers" },
];
const questionBank = {
  Park: {
    question: "What would you like to do?",
    field: "Best_For",
    secondaryField: "Main_Attraction",
    icon: "🌳",
    options: [
      { label: "Hiking & Nature Trails", value: "Hiking" },
      { label: "Wildlife Viewing & Safari", value: "Wildlife Viewing" },
      { label: "Bird Watching", value: "Bird Watching" },
      { label: "Photography", value: "Photography" },
      { label: "Family Picnic & Relaxation", value: "Families" },
      { label: "Cycling", value: "Cycling" },
      { label: "Conservation Experiences", value: "Conservation" },
    ],
  },

  Museum: {
    question: "What would you like to see?",
    field: "Experience_Type",
    secondaryField: "Main_Attraction",
    icon: "🏛",
    options: [
      { label: "Cultural Heritage", value: "Heritage Tourism" },
      { label: "Traditional Kenyan Culture", value: "Cultural Tourism" },
      { label: "Railway & Industrial History", value: "Industrial Heritage" },
      { label: "Natural History", value: "Heritage Tourism" },
      { label: "Sports History", value: "Sports Tourism" },
      { label: "Performing Arts & Dance", value: "Cultural Tourism" },
      { label: "Literary & Colonial History", value: "Literary Heritage" },
    ],
  },

  "Art Gallery": {
    question: "What interests you most?",
    field: "Art_Focus",
    secondaryField: "Main_Attraction",
    icon: "🎨",
    options: [
      { label: "Contemporary Art", value: "Contemporary Art" },
      { label: "Visual Arts & Studios", value: "Visual Arts" },
      { label: "Fine Art & Paintings", value: "Fine Art" },
      { label: "Historical Art", value: "Fine Art" },
    ],
  },

  "Historical Site": {
    question: "What would you like to explore?",
    field: "Experience_Type",
    secondaryField: "Art_Focus",
    icon: "🏺",
    options: [
      { label: "Architecture & City Views", value: "Architecture" },
      { label: "Urban History", value: "Urban Tourism" },
      { label: "National Heritage", value: "Heritage Tourism" },
    ],
  },

  Recreation: {
    question: "What activity are you looking for?",
    field: "Main_Attraction",
    secondaryField: "Best_For",
    icon: "⚡",
    options: [
      { label: "Ziplining & Adventure", value: "Ziplining" },
      { label: "Go Karting & Racing", value: "Go Karting" },
      { label: "Ice Skating", value: "Ice Skating" },
      { label: "Water Park & Swimming", value: "Water Park" },
      { label: "Golf", value: "Golf" },
    ],
  },

  "Sports Facility": {
    question: "What sport interests you?",
    field: "Main_Attraction",
    secondaryField: "Experience_Type",
    icon: "⚽",
    options: [
      { label: "Football", value: "Football" },
      { label: "Rugby", value: "Rugby" },
      { label: "Athletics & Multi-sport", value: "Athletics" },
      { label: "Horse Racing", value: "Horse Racing" },
    ],
  },

  "Shopping Centre": {
    question: "What are you looking for?",
    field: "Main_Attraction",
    secondaryField: "Experience_Type",
    icon: "🛍",
    options: [
      { label: "Shopping & Retail", value: "Shopping" },
      { label: "Dining & Food", value: "Dining" },
      { label: "Entertainment & Events", value: "Entertainment" },
      { label: "Local Market & Culture", value: "Local Market" },
      { label: "Family Outing", value: "Shopping" },
    ],
  },

  Restaurant: {
    question: "What kind of experience do you want?",
    field: "Experience_Type",
    secondaryField: "Main_Attraction",
    icon: "🍽",
    options: [
      { label: "Unique Dining Experience", value: "Food Tourism" },
      { label: "Cultural Cuisine", value: "Food Tourism" },
    ],
  },

  Accommodation: {
    question: "What kind of stay are you looking for?",
    field: "Experience_Type",
    secondaryField: "Art_Focus",
    icon: "🏨",
    options: [
      { label: "Cultural & Safari Experience", value: "Cultural Tourism" },
      { label: "Luxury & Scenic Views", value: "Cultural Tourism" },
    ],
  },
};

export default questionBank;