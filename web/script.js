/// FETCH DATA

// URL of the CSV file
const csvUrl = 'https://raw.githubusercontent.com/corintxt/papiris/main/testout.csv';

// Declare a variable globally
let csvData;

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

//// TABLE VIEW ////
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

/// CANDIDATE FILTER
// Function to generate the candidate filter dropdown
function generateCandidateFilter(data) {
  const candidates = new Set();
  for (let row of data) {
    if (row.candidate) {
      candidates.add(row.candidate);
    }
  }

  const filterSelect = document.getElementById('candidateFilter');
  filterSelect.innerHTML = '<option value="">All</option>';

  for (let candidate of candidates) {
    const option = document.createElement('option');
    option.value = candidate;
    option.text = candidate;
    filterSelect.appendChild(option);
  }

  filterSelect.addEventListener('change', function() {
    const selectedCandidate = this.value;
    const startDate = new Date(dateRangeStart.value);
    const endDate = new Date(dateRangeEnd.value);
    filterTableByCandidateAndDateRange(selectedCandidate, startDate, endDate);
  });
}

// Function to update the result count display
function updateResultCount(count) {
  const resultCountElement = document.getElementById('resultCount');
  resultCountElement.textContent = `Showing ${count} events`;
}

// Function to filter the table by candidate and date range
function filterTableByCandidateAndDateRange(selectedCandidate, startDate, endDate) {
  let filteredData = csvData;

  if (selectedCandidate) {
    filteredData = filteredData.filter(row => row.candidate === selectedCandidate);
  }

  filteredData = filteredData.filter(row => {
    const rowDate = new Date(row.date);
    return rowDate >= startDate && rowDate <= endDate;
  });

  generateTable(filteredData);
  updateResultCount(filteredData.length);
}

// SET DATE DEFAULTS / FILTER BY DATE
// Function to filter the table based on the selected date range
function filterTableByDateRange(startDate, endDate) {
  if (csvData) {
    const filteredData = csvData.filter(row => {
      const rowDate = new Date(row.date);
      return rowDate >= startDate && rowDate <= endDate;
    });
    generateTable(filteredData);
  }
}

// Event listeners for the date range inputs
const dateRangeStart = document.getElementById('dateRangeStart');
const dateRangeEnd = document.getElementById('dateRangeEnd');

dateRangeStart.addEventListener('change', applyDateFilter);
dateRangeEnd.addEventListener('change', applyDateFilter);

function applyDateFilter() {
  const startDate = new Date(dateRangeStart.value);
  const endDate = new Date(dateRangeEnd.value);
  const selectedCandidate = document.getElementById('candidateFilter').value;
  filterTableByCandidateAndDateRange(selectedCandidate, startDate, endDate);
}

// Function to get the current date or '2024-11-05', whichever is earlier
function getCurrentOrMaxDate() {
  const today = new Date();
  const maxDate = new Date('2024-11-05');
  return today < maxDate ? today : maxDate;
}

/// FETCH AND GENERATE FUNCTION
// Fetch the CSV data, generate the table, and generate the candidate filter
fetchCsvData(csvUrl, function(data) {
  csvData = data; // Assign the data to the global csvData variable
  generateTable(data);
  generateCandidateFilter(data);

    // Set initial values for the date range inputs
  const initialStartDate = new Date('2024-01-01');
  const initialEndDate = getCurrentOrMaxDate();

  dateRangeStart.value = initialStartDate.toISOString().split('T')[0];
  dateRangeEnd.value = initialEndDate.toISOString().split('T')[0];
  dateRangeEnd.max = '2024-11-05';
  filterTableByDateRange(initialStartDate, initialEndDate);

  // Update the result count for the initial table
  updateResultCount(data.length);
})

//// TOP STATES VIEW /////
/// CALCULATE TOP STATES
// Function to calculate the top states visited by each candidate within the selected date range
function calculateTopStates(data, startDate, endDate) {
  const candidateStates = {};

  for (let row of data) {
    const rowDate = new Date(row.date);
    if (rowDate >= startDate && rowDate <= endDate) {
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
  }

  const topStates = {};

  for (let candidate in candidateStates) {
    const stateVisits = candidateStates[candidate];
    const sortedStates = Object.entries(stateVisits).sort((a, b) => b[1] - a[1]);
    topStates[candidate] = sortedStates.slice(0, 5);
  }

  return topStates;
}

/// DISPLAY FUNCTIONS
// Function to display the original HTML table
function displayTable() {
    generateTable(csvData);
  }


// Function to display the full list of states for a candidate within the selected date range
function displayFullStatesList(candidateBox, candidate, startDate, endDate) {
  const table = candidateBox.querySelector('table');

  // Clear existing table rows
  table.innerHTML = `
    <tr>
      <th>State</th>
      <th>Visits</th>
    </tr>
  `;

  const filteredData = csvData.filter(row => {
    const rowDate = new Date(row.date);
    return row.candidate === candidate && rowDate >= startDate && rowDate <= endDate;
  });

  const stateVisits = {};
  for (let row of filteredData) {
    const state = row.state;
    if (state !== 'United States' && state !== 'Unknown') {
      if (!stateVisits[state]) {
        stateVisits[state] = 0;
      }
      stateVisits[state]++;
    }
  }

  // Add rows for all states within the selected date range, excluding "United States" and "Unknown"
  for (let state in stateVisits) {
    const visits = stateVisits[state];
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${state}</td>
      <td>${visits}</td>
    `;
    table.appendChild(row);
  }
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

    let displayedStates = 0;
    for (let [state, visits] of topStates[candidate]) {
      if (state !== 'United States' && state !== 'Unknown') {
        html += `<tr>
                   <td>${state}</td>
                   <td>${visits}</td>
                 </tr>`;
        displayedStates++;
      }
      if (displayedStates === 5) {
        break;
      }
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
      const startDate = new Date(dateRangeStart.value);
      const endDate = new Date(dateRangeEnd.value);
      displayFullStatesList(candidateBox, candidate, startDate, endDate);
    });
  }
}

/// BUTTON EVENT LISTENERS
// Event listener for the "View Top States" button
document.getElementById('viewTopStatesBtn').addEventListener('click', function() {
  const startDate = new Date(dateRangeStart.value);
  const endDate = new Date(dateRangeEnd.value);
  const topStates = calculateTopStates(csvData, startDate, endDate);
  displayTopStates(topStates);
});
  
  // Event listener for the "View Events" button
  document.getElementById('viewEventsBtn').addEventListener('click', function() {
    displayTable();
  });