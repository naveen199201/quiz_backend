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
  .connect("mongodb://uijdjvpxv8zvy7x1ziqj:z91Bi5O57q7eYBupUoy@badlozhaoglgjzlj1679-mongodb.services.clever-cloud.com:2627/badlozhaoglgjzlj1679", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
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
  answers: [
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
    console.log(req.body);
    const reqPromises=[];
    // Save Cloze Questions
    if(clozeQuestions.length>0){
    const clozePromises = clozeQuestions.map((question) =>
      new Cloze(question).save()
    )
    reqPromises.push(clozePromises)
  };

    // Save Categorize Questions
    if(categorizeQuestions.length>0){
    const categorizePromises = categorizeQuestions.map((question) =>
      new Categorize(question).save()
    )
    reqPromises.push(categorizePromises)

  };

    // Save Comprehension Questions
    if(comprehensionQuestions.length>0){
    const comprehensionPromises = comprehensionQuestions.map((question) =>
      new Comprehension(question).save()
    )
    reqPromises.push(comprehensionPromises)

  };

    // Execute all save operations in parallel
    // if()

    await Promise.all(reqPromises);
    

    res.status(200).json({ message: "Questions saved successfully!" });
  } catch (error) {
    console.error("Error saving questions:", error);
    res.status(500).json({ error: "An error occurred while saving questions." });
  }
});

// GET API to Fetch All Questions
app.get("/api/questions", async (req, res) => {
  console.log("hello");
  try {
    const clozeQuestions = await Cloze.find();
    const categorizeQuestions = await Categorize.find();
    const comprehensionQuestions = await Comprehension.find();

    res.status(200).json({
      clozeQuestions,
      categorizeQuestions,
      comprehensionQuestions,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "An error occurred while fetching questions." });
  }
});
app.get("/", (req, res) => res.send("Express on Vercel"));
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
