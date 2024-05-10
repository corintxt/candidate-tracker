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

// Fetch the CSV data, generate the table, and generate the candidate filter
fetchCsvData(csvUrl, function(data) {
  generateTable(data);
  generateCandidateFilter(data);
});