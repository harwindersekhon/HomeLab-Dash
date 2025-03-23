const PIHOLE_BASE_URL = "http://YOUR_PIHOLE_IP"; // Replace with your Pi-hole IP, e.g., http://192.168.1.66
const API = `${PIHOLE_BASE_URL}/api`;
const PASSWORD = "XX"; // Replace XX with your Pi-hole password
let sid; // Session ID

// Authenticate to get session ID (sid)
$.post(`${API}/auth`, JSON.stringify({ password: PASSWORD }), "json")
  .done((response) => {
    // Check if the session is valid and sid exists
    if (response.session && response.session.sid) {
      sid = response.session.sid;
      console.log("Authenticated, Session ID:", sid);

      // After successful authentication, call the function to update stats
      updatePiHoleStats();
    } else {
      console.error("Authentication failed:", response);
    }
  })
  .fail((jqXHR, textStatus, errorThrown) => {
    console.error("Authentication error:", textStatus, errorThrown);
  });

// Function to update Pi-Hole stats using the session ID
function updatePiHoleStats() {
  if (!sid) {
    console.error("Session ID is missing!");
    return;
  }

  var settings = {
    url: `${API}/stats/summary`, // Centralized URL for stats summary
    method: "GET",
    timeout: 0,
    headers: {
      Accept: "application/json",
      sid: sid,
      Cookie: `sid=${sid}`,
    },
  };

  $.ajax(settings)
    .done(function (response) {
      console.log("API Response:", response);

      // Update Total Queries
      $("#total-queries").text(
        response.queries && response.queries.total
          ? response.queries.total.toLocaleString()
          : "Data not available"
      );

      // Update Total Blocked
      $("#total-blocked").html(
        response.queries && response.queries.blocked
          ? `Total blocked: <span class="count">${response.queries.blocked.toLocaleString()}</span>`
          : "Total blocked: <span class='count'>Data not available</span>"
      );

      // Fetch Recent Blocked Domains
      $.ajax({
        url: `${API}/stats/recent_blocked?count=2`, // Centralized URL
        method: "GET",
        timeout: 0,
        headers: {
          Accept: "application/json",
          sid: sid,
        },
      })
        .done(function (recentBlockedResponse) {
          console.log("Recent Blocked Domains:", recentBlockedResponse);
          $("#recent-blocked").html(
            recentBlockedResponse.blocked &&
              recentBlockedResponse.blocked.length > 0
              ? recentBlockedResponse.blocked
                  .map((domain) => `<li class="list-group-item">${domain}</li>`)
                  .join("")
              : "<li class='list-group-item'>No recent blocks</li>"
          );
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          console.error(
            "Recent Blocked API request error:",
            textStatus,
            errorThrown
          );
          $("#recent-blocked").html(
            "<li class='list-group-item'>Error loading data</li>"
          );
        });

      // Fetch Top Domains
      $.ajax({
        url: `${API}/stats/top_domains?count=5`, // Centralized URL
        method: "GET",
        timeout: 0,
        headers: {
          Accept: "application/json",
          sid: sid,
        },
      })
        .done(function (topDomainsResponse) {
          console.log("Top Domains:", topDomainsResponse);
          if (
            topDomainsResponse.domains &&
            topDomainsResponse.domains.length > 0
          ) {
            // Limit to top 8 items for compactness (adjust as needed)
            let domainsArray = topDomainsResponse.domains.slice(0, 8);

            // Generate tag-style HTML with domain as text and count as badge
            const tags = domainsArray
              .map(
                (item) =>
                  `<span class="domain-tag me-2 mb-1" title="${
                    item.domain
                  } (${item.count.toLocaleString()})">${
                    item.domain
                  } <span class="badge bg-primary">${item.count.toLocaleString()}</span></span>`
              )
              .join("");

            // Insert into the DOM
            $("#top-domains").html(`<div class="tags-container">${tags}</div>`);
          } else {
            $("#top-domains").html("<span class='text-muted'>No data</span>");
          }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          console.error(
            "Top Domains API request error:",
            textStatus,
            errorThrown
          );
          $("#top-domains").html(
            "<li class='list-group-item'>Error loading data</li>"
          );
        });

      // Fetch Query Types
      $.ajax({
        url: `${API}/stats/query_types`, // Centralized URL
        method: "GET",
        timeout: 0,
        headers: {
          Accept: "application/json",
          sid: sid,
        },
      })
        .done(function (queryTypesResponse) {
          console.log("Query Types:", queryTypesResponse);
          if (
            queryTypesResponse.types &&
            Object.keys(queryTypesResponse.types).length > 0
          ) {
            // Filter out types with count 0, sort by count descending
            let queryTypesArray = Object.entries(queryTypesResponse.types)
              .filter(([_, count]) => count > 0) // Only include types with counts > 0
              .sort(([, countA], [, countB]) => countB - countA); // Sort by count descending

            // Split the array into two halves
            const midPoint = Math.ceil(queryTypesArray.length / 2);
            const leftColumnTypes = queryTypesArray.slice(0, midPoint);
            const rightColumnTypes = queryTypesArray.slice(midPoint);

            // Generate HTML for each column
            const leftList = leftColumnTypes
              .map(
                ([type, count]) =>
                  `<li class="list-group-item">${type} <span class="badge bg-primary float-end">${count.toLocaleString()}</span></li>`
              )
              .join("");
            const rightList = rightColumnTypes
              .map(
                ([type, count]) =>
                  `<li class="list-group-item">${type} <span class="badge bg-primary float-end">${count.toLocaleString()}</span></li>`
              )
              .join("");

            // Insert both columns into the DOM
            $("#query-types").html(`
              <div class="row">
                <div class="col-6">
                  <ul class="list-group list-group-flush">${leftList}</ul>
                </div>
                <div class="col-6">
                  <ul class="list-group list-group-flush">${rightList}</ul>
                </div>
              </div>
            `);
          } else {
            $("#query-types").html("<p>No query types available</p>");
          }
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
          console.error(
            "Query Types API request error:",
            textStatus,
            errorThrown
          );
          $("#query-types").html("<p>Error loading query types</p>");
        });

      // Update Top Clients
      $("#top-clients").html(
        response.clients && response.clients.active
          ? `<li class="list-group-item">Active Clients: ${response.clients.active.toLocaleString()}</li>`
          : "<li class='list-group-item'>No data</li>"
      );
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error("API request error:", textStatus, errorThrown);
    });
}
