const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Use express.json() for JSON parsing

// Connect to MongoDB
mongoose
  .connect(
    "mongodb://uijdjvpxv8zvy7x1ziqj:z91Bi5O57q7eYBupUoy@badlozhaoglgjzlj1679-mongodb.services.clever-cloud.com:2627/badlozhaoglgjzlj1679",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define Schemas and Models
const ClozeSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  underlinedWords: { type: [String], required: true },
  answerText: { type: String, required: true },
});

const CategorizeSchema = new mongoose.Schema({
  // questionText: { type: String, required: true },
  
  categories: { type: [String], required: true },
  items: [
    {
      category: { type: String, required: true },
      answer: { type: String, required: true },
    },
  ],
});

const ComprehensionSchema = new mongoose.Schema({
  paragraph: { type: String, required: true },
  questions: [
    {
      text: { type: String, required: true },
      options: { type: [String], required: true },
      correctOption: { type: Number, required: true },
    },
  ],
});
const Cloze = mongoose.model("Cloze", ClozeSchema);
const Categorize = mongoose.model("Categorize", CategorizeSchema);
const Comprehension = mongoose.model("Comprehension", ComprehensionSchema);

// POST API to Save Questions
app.post("/api/questions", async (req, res) => {
  try {
    const {
      clozeQuestions = [],
      categorizeQuestions = [],
      comprehensionQuestions = [],
    } = req.body;

    console.log(req.body);  // Logging the request body for debugging

    const reqPromises = [];

    // Save or Update Cloze Questions
    if (clozeQuestions.length > 0) {
      const clozePromises = clozeQuestions.map((question) => {
        if (question._id) {
          // If the question has an _id, update it
          return Cloze.findByIdAndUpdate(question._id, question, { new: true });
        } else {
          // If the question does not have an _id, create a new question
          return new Cloze(question).save();
        }
      });
      reqPromises.push(...clozePromises);
    }

    // Save or Update Categorize Questions
    if (categorizeQuestions.length > 0) {
      const categorizePromises = categorizeQuestions.map((question) => {
        if (question._id) {
          // If the question has an _id, update it
          return Categorize.findByIdAndUpdate(question._id, question, { new: true });
        } else {
          // If the question does not have an _id, create a new question
          return new Categorize(question).save();
        }
      });
      reqPromises.push(...categorizePromises);
    }

    // Save or Update Comprehension Questions
    if (comprehensionQuestions.length > 0) {
      const comprehensionPromises = comprehensionQuestions.map((question) => {
        if (question._id) {
          // If the question has an _id, update it
          return Comprehension.findByIdAndUpdate(question._id, question, { new: true });
        } else {
          // If the question does not have an _id, create a new question
          return new Comprehension(question).save();
        }
      });
      reqPromises.push(...comprehensionPromises);
    }

    // Execute all save/update operations in parallel
    await Promise.all(reqPromises);

    res.status(200).json({ message: "Questions saved/updated successfully!" });
  } catch (error) {
    console.error("Error saving/updating questions:", error);
    res.status(500).json({ error: "An error occurred while saving or updating questions." });
  }
});


// POST API to Save Submissions
app.post("/api/submissions", async (req, res) => {
  try {
    const dynamicSchema = new mongoose.Schema(
      {
        data: {
          type: Map,
          of: Object, // Allows any nested structure, including arrays
        },
      },
      { strict: false } // Allow additional fields not defined in the schema
    );
    const submissionsModel = mongoose.model("Submissions", dynamicSchema);
    console.log(req.body);
    await submissionsModel(req.body).save();
    res.status(200).json({ message: "Submissons saved successfully!" });
  } catch (error) {
    console.error("Error saving Submissons:", error);
    res
      .status(500)
      .json({ error: "An error occurred while saving Submissons." });
  }
});
// GET API to Fetch All Questions
app.get("/api/questions", async (req, res) => {
  console.log("hello");
  const { quiz } = req.query;
  let clozeParams={};
  let comprehensionParams = {};
  let categorizeParams = {};
  if(quiz){
    clozeParams={ answerText: 0 };
    comprehensionParams = { "items.category": 0 };
    categorizeParams = { "questions.correctOption": 0 };
  }

  try {
    const clozeQuestions = await Cloze.find({},clozeParams);
    const categorizeQuestions = await Categorize.find(
      {},
      categorizeParams
    );
    const comprehensionQuestions = await Comprehension.find(
      {},
      comprehensionParams
    );

    res.status(200).json({
      clozeQuestions,
      categorizeQuestions,
      comprehensionQuestions,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching questions." });
  }
});
app.get("/", (req, res) => res.send("Express on Vercel"));
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
