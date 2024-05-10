/// FETCH DATA

// URL of the CSV file
const csvUrl = 'https://raw.githubusercontent.com/corintxt/papiris/main/testout.csv';

// Function to fetch and parse the CSV data
function fetchCsvData(url, callback) {
  Papa.parse(url, {
    download: true,
    header: true,
    complete: function(results) {
      callback(results.data);
    }
  });
}

/// GENERATE EVENT OVERVIEW TABLE
// Function to generate the HTML table from the CSV data
function generateTable(data) {
  let table = '<table>';
  
  // Generate table header
  table += '<tr>';
  for (let column in data[0]) {
    table += `<th>${column}</th>`;
  }
  table += '</tr>';

  // Generate table rows
  for (let row of data) {
    table += '<tr>';
    for (let column in row) {
      if (column === 'status') {
        let statusEmoji = '';
        switch (row[column]) {
          case 'VALID':
            statusEmoji = '&#9989;'; // Green check emoji
            break;
          case 'NOT_USABLE':
            statusEmoji = '&#10060;'; // Red cross emoji
            break;
          case 'CANDIDATE':
            statusEmoji = '&#128993;'; // Yellow circle emoji 
            break;
          default:
            statusEmoji = row[column];
        }
        table += `<td>${statusEmoji}</td>`;
      } else {
        table += `<td>${row[column]}</td>`;
      }
    }
    table += '</tr>';
  }

  table += '</table>';

  // Insert the table into the container element
  document.getElementById('table-container').innerHTML = table;
}

// Function to generate the candidate filter dropdown
function generateCandidateFilter(data) {
  const candidates = new Set();
  for (let row of data) {
    if (row.candidate) {
      candidates.add(row.candidate);
    }
  }

  const filterSelect = document.getElementById('candidateFilter');
  for (let candidate of candidates) {
    const option = document.createElement('option');
    option.value = candidate;
    option.text = candidate;
    filterSelect.appendChild(option);
  }

  filterSelect.addEventListener('change', function() {
    const selectedCandidate = this.value;
    const filteredData = selectedCandidate ? data.filter(row => row.candidate === selectedCandidate) : data;
    generateTable(filteredData);
  });
}

/// CALCULATE TOP STATES
let csvData;

// Function to calculate the top states visited by each candidate
function calculateTopStates(data) {
const candidateStates = {};

for (let row of data) {
    const candidate = row.candidate;
    const state = row.state;

    if (!candidateStates[candidate]) {
    candidateStates[candidate] = {};
    }

    if (!candidateStates[candidate][state]) {
    candidateStates[candidate][state] = 0;
    }

    candidateStates[candidate][state]++;
}

const topStates = {};

for (let candidate in candidateStates) {
    const stateVisits = candidateStates[candidate];
    const sortedStates = Object.entries(stateVisits).sort((a, b) => b[1] - a[1]);
    topStates[candidate] = sortedStates.slice(0, 10);
}

return topStates;
}

/// DISPLAY FUNCTIONS

// Function to display the original HTML table
function displayTable() {
    generateTable(csvData);
  }

// Function to display the top states for each candidate
function displayTopStates(topStates) {
    let html = '';
  
    for (let candidate in topStates) {
      html += `<div class="candidate-box" data-candidate="${candidate}">
                 <h2>${candidate}</h2>
                 <table class="top-states-table">
                   <tr>
                     <th>State</th>
                     <th>Visits</th>
                   </tr>`;
  
      for (let [state, visits] of topStates[candidate].slice(0, 5)) {
        html += `<tr>
                   <td>${state}</td>
                   <td>${visits}</td>
                 </tr>`;
      }
  
      html += `</table>
               <button class="full-list-btn">Full List</button>
               </div>`;
    }
  
    document.getElementById('table-container').innerHTML = html;
  
    // Event listeners for the "full list" buttons
    const fullListButtons = document.getElementsByClassName('full-list-btn');
    console.log('Full List Buttons:', fullListButtons);
  
    for (let button of fullListButtons) {
      button.addEventListener('click', function() {
        const candidateBox = this.closest('.candidate-box');
        const candidate = candidateBox.getAttribute('data-candidate');
        console.log('Clicked Candidate:', candidate);
        displayFullStatesList(candidateBox, topStates[candidate]);
      });
    }
  }
  
  // Function to display the full list of states for a candidate
  function displayFullStatesList(candidateBox, stateVisits) {
    console.log('Displaying Full States List for:', candidateBox);
    const table = candidateBox.querySelector('table');
  
    // Clear existing table rows
    table.innerHTML = `
      <tr>
        <th>State</th>
        <th>Visits</th>
      </tr>
    `;
  
    // Add rows for all states
    for (let [state, visits] of stateVisits) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${state}</td>
        <td>${visits}</td>
      `;
      table.appendChild(row);
    }
  }
  

/// EVENT LISTENERS

// Event listener for the "View Top States" button
document.getElementById('viewTopStatesBtn').addEventListener('click', function() {
    const topStates = calculateTopStates(csvData);
    displayTopStates(topStates);
  });
  
  // Event listener for the "View Events" button
  document.getElementById('viewEventsBtn').addEventListener('click', function() {
    displayTable();
  });


// Fetch the CSV data, generate the table, and generate the candidate filter
fetchCsvData(csvUrl, function(data) {
    generateTable(data);
    generateCandidateFilter(data);
    csvData = data; // Assign the data to the csvData variable
  });