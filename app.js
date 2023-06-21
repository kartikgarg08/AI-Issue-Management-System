const fs = require("fs");
const readline = require("readline");
const axios = require("axios");

const apiKey = "API_KEY"; // Replace with your OpenAI API key
const endpoint = "https://api.openai.com/v1/completions"; // API endpoint URL

const categories =
  "Server_Team, Network_Team, Storage_Team, Voice_Team, Data_Team, Applications_Team, General_Support, Miscellaneous";
// Predefined list of categories

// const categories =
//   "Hardware_Issues, Network_Connectivity, Data_Storage, Communication_Errors, Software_Bugs, User_Support, Security_Concerns, System_Performance";

const priorities = "P1, P2, P3, P4"; // Predefined list of priorities

async function classifyIssues() {
  try {
    const categorizedIssues = [];

    const rl = readline.createInterface({
      input: fs.createReadStream("issues.csv"),
      output: process.stdout,
      terminal: false,
    });

    for await (const line of rl) {
      const [id, issue_id, issue_title, reported_time, owner, description] =
        line.split(",");

      // Check if any of the specified fields is undefined
      if (
        id === undefined ||
        issue_id === undefined ||
        issue_title === undefined ||
        reported_time === undefined ||
        owner === undefined ||
        description === undefined
      ) {
        continue; // Skip the record and proceed to the next iteration
      }

      // Generate dynamic prompt with issue details for category
      const categoryPrompt = `Categorize the following issue in one of the given categories:\n\n${categories}\n\nIssue Title: ${issue_title}\n\nIssue Description: ${description}\n\nCategory:`;

      // Generate dynamic prompt with issue details for priority
      const priorityPrompt = `Prioritize the following issue in one of the given priorities:\n\n${priorities}\n\nIssue Title: ${issue_title}\n\nIssue Description: ${description}\n\nPriority:`;

      // Call OpenAI API to get the category
      const categoryResponse = await axios.post(
        endpoint,
        {
          model: "text-davinci-003",
          prompt: categoryPrompt,
          temperature: 0.2,
          max_tokens: 64,
          top_p: 1.0,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const categoryData = categoryResponse.data;

      // Extract the categorized category
      let classifiedCategory = "";
      if (
        categoryData &&
        categoryData.choices &&
        categoryData.choices.length > 0 &&
        categoryData.choices[0].text
      ) {
        classifiedCategory = categoryData.choices[0].text.trim();
      }

      // Call OpenAI API to get the priority
      const priorityResponse = await axios.post(
        endpoint,
        {
          model: "text-davinci-003",
          prompt: priorityPrompt,
          temperature: 0.2,
          max_tokens: 64,
          top_p: 1.0,
          frequency_penalty: 0.0,
          presence_penalty: 0.0,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      const priorityData = priorityResponse.data;

      // Extract the categorized priority
      let classifiedPriority = "";
      if (
        priorityData &&
        priorityData.choices &&
        priorityData.choices.length > 0 &&
        priorityData.choices[0].text
      ) {
        classifiedPriority = priorityData.choices[0].text.trim();
      }

      // Store the categorized issue with category and priority
      categorizedIssues.push({
        id,
        issue_id,
        issue_title,
        reported_time,
        owner,
        description,
        category: classifiedCategory,
        priority: classifiedPriority,
      });
    }

    // Write the categorized issues to a new CSV file
    const csvContent = [
      "ID,Issue ID,Issue Title,Reported Time,Owner,Description,Category,Priority",
      ...categorizedIssues.map(
        (issue) =>
          `${issue.id},${issue.issue_id},"${issue.issue_title}","${issue.reported_time}","${issue.owner}","${issue.description}","${issue.category}","${issue.priority}"`
      ),
    ].join("\n");

    fs.writeFileSync("categorized_issues.csv", csvContent);

    console.log(
      "Categorized issues have been stored in categorized_issues.csv"
    );
    console.log("Task 1 Done.");
  } catch (error) {
    console.error("Error:", error);
  }
}

// function convertCSVtoJSON() {
//   const csvFilePath = "categorized_issues.csv";
//   const jsonFilePath = "issuesJS.json";

//   const jsonArray = [];

//   fs.readFile(csvFilePath, "utf8", (err, csvData) => {
//     if (err) {
//       console.error("Error reading the CSV file:", err);
//       return;
//     }

//     const lines = csvData.trim().split("\n");
//     const headers = lines[0].split(",").map((header) => header.trim());

//     for (let i = 1; i < lines.length; i++) {
//       const values = lines[i].split(",");
//       const record = {};

//       for (let j = 0; j < headers.length; j++) {
//         const key = headers[j];
//         let value = values[j].trim();

//         // Removing extra double quotes from the value
//         if (value.startsWith('"') && value.endsWith('"')) {
//           value = value.slice(1, -1);
//         }

//         record[key] = value;
//       }

//       jsonArray.push(record);
//     }

//     const jsonData = { Teams: jsonArray };

//     fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), (err) => {
//       if (err) {
//         console.error("Error writing the JSON file:", err);
//         return;
//       }

//       console.log(
//         `CSV file "${csvFilePath}" has been converted to JSON file "${jsonFilePath}".`
//       );
//       console.log(
//         "Task 2 Done."
//       );
//     });
//   });
// }

function convertCSVtoJSON() {
  return new Promise((resolve, reject) => {
    const csvFilePath = "categorized_issues.csv";
    const jsonFilePath = "issuesJS.json";

    const jsonArray = [];

    fs.readFile(csvFilePath, "utf8", (err, csvData) => {
      if (err) {
        console.error("Error reading the CSV file:", err);
        reject(err); // Reject the promise if there's an error
        return;
      }

      const lines = csvData.trim().split("\n");
      const headers = lines[0].split(",").map((header) => header.trim());

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        const record = {};

        for (let j = 0; j < headers.length; j++) {
          const key = headers[j];
          let value = values[j].trim();

          // Removing extra double quotes from the value
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }

          record[key] = value;
        }

        jsonArray.push(record);
      }

      const jsonData = { Teams: jsonArray };

      fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          console.error("Error writing the JSON file:", err);
          reject(err); // Reject the promise if there's an error
          return;
        }

        console.log(
          `CSV file "${csvFilePath}" has been converted to JSON file "${jsonFilePath}".`
        );
        console.log("Task 2 Done.");

        resolve(); // Resolve the promise when conversion is complete
      });
    });
  });
}

function processIssueData() {
  if (!fs.existsSync("categorized_issues.csv")) {
    console.log(
      'categorized_issues.csv does not exist. Please run the "classifyIssues" function first.'
    );
    return;
  }

  if (!fs.existsSync("issuesJS.json")) {
    console.log(
      'issuesJS.json does not exist. Please run the "convertCSVtoJSON" function first.'
    );
    return;
  }

  const jsonFilePath = "issuesJS.json";
  // Read data from the JSON files
  const issuesData = fs.readFileSync(jsonFilePath);
  const teamsData = fs.readFileSync("teams.json");

  const issues = JSON.parse(issuesData).Teams;
  const teams = JSON.parse(teamsData).Teams[0];

  // Extract the "Issue ID" and "Category" fields from the issues data
  const extractedData = issues.map((team) => ({
    "Issue ID": team["Issue ID"],
    Category: team.Category,
  }));

  // Sort the data based on the "Category"
  extractedData.sort((a, b) => a.Category.localeCompare(b.Category));

  // Count the number of issues for each category
  const categoryCount = {};
  extractedData.forEach((item) => {
    categoryCount[item.Category] = (categoryCount[item.Category] || 0) + 1;
  });

  console.log("Category count:");
  console.log(categoryCount);

  // Prepare the output data
  const outputData = { Teams: [] };

  Object.values(teams).forEach((team) => {
    const teamName = team[0].Team_Name;
    const teamMembers = Object.keys(team[0]).filter(
      (key) => key !== "Team_id" && key !== "Team_Name"
    );

    const totalIssues = categoryCount[teamName] || 0;

    const teamData = {
      [teamName]: team.map((person) => {
        const personData = {
          Team_id: person.Team_id,
          Team_Name: person.Team_Name,
          ...teamMembers.reduce((acc, member) => {
            acc[member] = person[member];
            return acc;
          }, {}),
          Total_issues: totalIssues.toString(),
          Issues_Assigned: {},
        };

        // Sort team members based on the number of issues they already have (ascending order)
        teamMembers.sort((a, b) => {
          const issuesA = parseInt(personData[a]) || 0;
          const issuesB = parseInt(personData[b]) || 0;
          return issuesA - issuesB;
        });

        // console.log(`\nAssigning issues to ${teamName}`);

        let remainingIssues = totalIssues;
        let assignedIssues = 0;

        while (remainingIssues > 0) {
          teamMembers.forEach((member, index) => {
            const beforeIssues = parseInt(personData[member]) || 0;

            if (remainingIssues > 0) {
              let issuesToAdd = 1;
              if (index === 0 && assignedIssues % teamMembers.length === 0) {
                // Increase the number of issues to add for the first person in each round
                issuesToAdd = 2;
              }
              const availableIssues = Math.min(remainingIssues, issuesToAdd);

              personData[member] = (beforeIssues + availableIssues).toString();
              remainingIssues -= availableIssues;
              assignedIssues += availableIssues;
            }

            const afterIssues = parseInt(personData[member]) || 0;

            // console.log(
            //   `Assigned ${
            //     afterIssues - beforeIssues
            //   } issues to ${member} (Before: ${beforeIssues}, After: ${afterIssues})`
            // );

            personData.Issues_Assigned[member] = {
              Before: beforeIssues.toString(),
              After: afterIssues.toString(),
            };
          });
        }

        return personData;
      }),
    };

    outputData.Teams.push(teamData);
  });

  // Convert the data back to JSON format
  const outputJSON = JSON.stringify(outputData, null, 2);

  // Write the output JSON to a file
  fs.writeFileSync("output.json", outputJSON);

  console.log("All Tasks have been assigned.");
  console.log("Task 3 Done.");
}

async function main() {
  let isConvertCSVtoJSONComplete = false;

  if (!fs.existsSync("issues.csv")) {
    console.log("issues.csv does not exist.");
    return;
  }
  if (!fs.existsSync("teams.json")) {
    console.log("teams.json does not exist.");
    return;
  }
  try {
    await classifyIssues();
    await convertCSVtoJSON();
    isConvertCSVtoJSONComplete = true;
  } catch (error) {
    console.error("Error:", error);
  }

  if (isConvertCSVtoJSONComplete) {
    try {
      await processIssueData();
      console.error("All Tasks Done");
    } catch (error) {
      console.error("Error:", error);
    }
  }

  //   try {
  //     processIssueData();
  //   } catch (error) {
  //     console.error("Error:", error);
  //   }
}

main();
