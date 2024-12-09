const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 5000;


app.use(cors());
app.use(express.json()); 

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
  image: {
    data: Buffer,
    contentType: String,
  },
  questionText: { type: String, required: true },
  underlinedWords: { type: [String], required: true },
  answerText: { type: String, required: true },
  rawText:{type:String,required:true}
});

const CategorizeSchema = new mongoose.Schema({
  description: { type: String },
  image: {
    data: Buffer,
    contentType: String,
  },
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
  image: {
    data: Buffer,
    contentType: String,
  },
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

const imageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    data: Buffer,       // Binary data for the image
    contentType: String, // MIME type of the image
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const Image = mongoose.model('Image', imageSchema);


// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, '/api/uploads'); // Save image in the 'public/uploads' folder
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Create unique file name
//   },
// });
const storage = multer.memoryStorage();
const upload = multer({ storage});

app.post("/imageupload", upload.single("image"), async (req, res) => {

  try{
    const newImage = new Image({
      name: req.file.originalname,     
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
    });

    const savedImage = await newImage.save();
    res.status(200).json({
      message: "Image uploaded successfully",
      imageId: savedImage._id, // Return the ID for retrieval
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload image" });
  }
});


app.post("/api/questions", async (req, res) => {
  try {
    const {
      clozeQuestions = [],
      categorizeQuestions = [],
      comprehensionQuestions = [],
    } = req.body;


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

    if (comprehensionQuestions.length > 0) {
      const comprehensionPromises = comprehensionQuestions.map((question) => {
        if (question._id) {

          return Comprehension.findByIdAndUpdate(question._id, question, { new: true });
        } else {
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

app.post("/api/remove", async (req, res) => {
  const { type, id, mcq_id } = req.query;  // Expect query parameters: type, id, and optionally mcq_id
  
  // Check if the necessary parameters are provided
  if (!type|| !id) {
    return res.status(400).json({ error: "Both 'type' and 'id' are required" });
  }

  try {
    let deletedQuestion;

    // Perform the deletion based on the type type
    switch (type.toLowerCase()) {
      case "cloze":
        deletedQuestion = await Cloze.findByIdAndDelete({_id:id});
        break;

      case "categorize":
        deletedQuestion = await Categorize.findByIdAndDelete({_id:id});
        break;

      case "comprehension":
        // If mcq_id is provided, try to delete from comprehensionQuestions.questions array
        if (mcq_id) {
          deletedQuestion = await Comprehension.findOneAndUpdate(
            { _id: id, "questions._id": mcq_id },  // Find the specific question by mcq_id in the questions array
            { $pull: { questions: { _id: mcq_id } } },  // Remove the question from the questions array
            { new: true }  // Return the updated document
          );
        } else {
          // If mcq_id is not provided, delete the entire comprehension question
          deletedQuestion = await comprehensionQuestions.findByIdAndDelete(id);
        }
        break;

      default:
        return res.status(400).json({ error: "Invalid type type" });
    }

    // If no question is found in the given type
    if (!deletedQuestion) {
      return res.status(404).json({ error: `${type} question not found` });
    }

    // Return success response
    res.status(200).json({ message: `${type} question deleted successfully` });
  } catch (error) {
    console.error(`Error deleting ${type} question:`, error);
    res.status(500).json({ error: `An error occurred while deleting the ${type} question.` });
  }
});


app.get("/", (req, res) => res.send("Express on Vercel"));
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
