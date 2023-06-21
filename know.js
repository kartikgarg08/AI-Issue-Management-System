const fs = require("fs");
const readline = require("readline");
const https = require("https");

// Set up OpenAI API key
const apiKey = "API_KEY";

// Read categorized issues from CSV file
const readCategorizedIssues = () => {
  return new Promise((resolve, reject) => {
    const categorizedIssues = [];
    const fileStream = fs.createReadStream("categorized_issues.csv");

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => {
      const issueData = line.split(",");
      const issue = {
        id: issueData[0].replace(/"/g, ""),
        issueID: issueData[1].replace(/"/g, ""),
        issueTitle: issueData[2].replace(/"/g, ""),
        reportedTime: issueData[3].replace(/"/g, ""),
        owner: issueData[4].replace(/"/g, ""),
        description: issueData[5].replace(/"/g, ""),
        category: issueData[6].replace(/"/g, ""),
        priority: issueData[7].replace(/"/g, ""),
      };
      categorizedIssues.push(issue);
    });

    rl.on("close", () => {
      console.log("Categorized issues read successfully.");
      resolve(categorizedIssues);
    });

    rl.on("error", (error) => {
      console.log("An error occurred while reading categorized issues:", error);
      reject(error);
    });
  });
};

// Read KB articles from JSON file
const readKBArticles = () => {
  return new Promise((resolve, reject) => {
    fs.readFile("kb.json", "utf8", (error, data) => {
      if (error) {
        console.log("An error occurred while reading KB articles:", error);
        reject(error);
        return;
      }
      try {
        const kbArticles = JSON.parse(data).articles;
        console.log("KB articles read successfully.");
        resolve(kbArticles);
      } catch (parseError) {
        console.log("An error occurred while parsing KB articles:", parseError);
        reject(parseError);
      }
    });
  });
};

// Get matching FAQs based on category
const getMatchingFAQs = (kbArticles, category) => {
  if (!kbArticles || !Array.isArray(kbArticles)) {
    throw new Error("Invalid KB articles format.");
  }
  return kbArticles.filter((article) => article.category === category);
};

// Generate API call to OpenAI
const generateAPIRequest = async (issue, faq) => {
  const prompt = `Issue Title: ${issue.issueTitle}\n\nIssue Description: ${issue.description}\n\nFAQ Title: ${faq.title}\n\Will the FAQ answer the issue? :`;

  // Call OpenAI API
  // console.log("Final prompt: " + prompt);
  const response = await callOpenAI(prompt);

  if (response.choices && response.choices.length > 0) {
    return response.choices[0].text.trim().toLowerCase();
  } else {
    return ""; // Return an empty string if no choices are available
  }
};

// Call OpenAI API
const callOpenAI = (prompt) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 1,
      temperature: 0,
      top_p: 1.0,
      n: 1,
    });

    const options = {
      hostname: "api.openai.com",
      path: "/v1/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
        Authorization: `Bearer ${apiKey}`,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        resolve(JSON.parse(responseData));
      });
    });

    req.on("error", (error) => {
      console.error("An error occurred while calling OpenAI API:", error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

// Perform the check for each FAQ

const performFAQCheck = async (issue, faqs) => {
  const matchingFAQs = []; // Array to store matching FAQs

  for (const faq of faqs) {
    const result = await generateAPIRequest(issue, faq);
    const response = result.toLowerCase(); // Convert the response to lowercase
    console.log(`FAQ ID: ${faq.id}`);
    console.log("API response:", response); // Log the API response

    if (response === "yes") {
      matchingFAQs.push(faq);
    }
  }

  if (matchingFAQs.length === 0) {
    console.log(
      "No matching FAQs found for the selected category.Please provide a knowledge base for this."
    );
  } else {
    console.log("Retrieving content for the matching FAQs...");
    for (let i = 0; i < matchingFAQs.length; i++) {
      const faq = matchingFAQs[i];
      console.log(`FAQ ID: ${faq.id}`);
      console.log(`Content: ${faq.content}`);
      if (i !== matchingFAQs.length - 1) {
        console.log(); // Add a line break after each FAQ content except the last one
      }
    }
  }

  console.log("FAQ checks completed.");
};

// Main function
const main = async () => {
  try {
    const categorizedIssues = await readCategorizedIssues();
    const kbArticles = await readKBArticles();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Enter the issue ID: ", async (issueID) => {
      rl.close();

      const selectedIssue = categorizedIssues.find(
        (issue) => issue.id === issueID
      );
      if (!selectedIssue) {
        console.log("Invalid issue ID.");
        return;
      }

      const matchingFAQs = getMatchingFAQs(kbArticles, selectedIssue.category);
      if (matchingFAQs.length === 0) {
        console.log("No matching FAQs found for the selected category.");
        return;
      }

      await performFAQCheck(selectedIssue, matchingFAQs);
    });
  } catch (error) {
    console.log("An error occurred:", error);
  }
};

// Start the program
main();
