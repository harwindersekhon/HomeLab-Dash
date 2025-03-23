// Centralized Proxmox configuration
const PROXMOX_BASE_URL = "/api"; // Base URL for Proxmox API (relative path, adjust if needed)
const PROXMOX_API_TOKEN =
  "PVEAPIToken=api@pam!token2=cc2597cf-SOMETHING"; // Replace with your Proxmox API token

// Centralized headers object
const AUTH_HEADERS = {
  Authorization: PROXMOX_API_TOKEN,
};

// Fetch data from Proxmox API and update the DOM
function updateProxmoxStats() {
  var settings = {
    url: `${PROXMOX_BASE_URL}/nodes`, // Base node stats
    method: "GET",
    timeout: 0,
    headers: AUTH_HEADERS,
  };

  // Fetch node stats
  $.ajax(settings)
    .done(function (response) {
      if (response.data && response.data.length > 0) {
        var nodeData = response.data[0]; // Get the first node (e.g., "mini-pc")

        // Update CPU Usage
        var cpuPercent = (nodeData.cpu * 100).toFixed(2);
        $("#cpu-usage").text(cpuPercent + "%");
        $("#cpu-progress")
          .css("width", cpuPercent + "%")
          .attr("aria-valuenow", cpuPercent)
          .removeClass("bg-success bg-warning bg-danger")
          .addClass(
            cpuPercent > 80
              ? "bg-danger"
              : cpuPercent > 50
              ? "bg-warning"
              : "bg-success"
          );

        // Update RAM Usage
        var ramUsed = (nodeData.mem / (1024 * 1024 * 1024)).toFixed(2);
        var ramTotal = (nodeData.maxmem / (1024 * 1024 * 1024)).toFixed(2);
        var ramPercent = ((nodeData.mem / nodeData.maxmem) * 100).toFixed(2);
        $("#ram-usage").text(ramUsed + " / " + ramTotal + " GB");
        $("#ram-progress")
          .css("width", ramPercent + "%")
          .attr("aria-valuenow", ramPercent)
          .removeClass("bg-success bg-warning bg-danger")
          .addClass(
            ramPercent > 80
              ? "bg-danger"
              : ramPercent > 50
              ? "bg-warning"
              : "bg-success"
          );

        // Update Status
        $("#status")
          .text(nodeData.status === "online" ? "Online" : "Offline")
          .removeClass("text-danger text-success")
          .addClass(
            nodeData.status === "online" ? "text-success" : "text-danger"
          );

        // Update Uptime
        var uptimeSeconds = nodeData.uptime;
        var uptimeDays = Math.floor(uptimeSeconds / (60 * 60 * 24));
        var uptimeHours = Math.floor(
          (uptimeSeconds % (60 * 60 * 24)) / (60 * 60)
        );
        var uptimeMinutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
        $("#uptime").text(`${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`);
      } else {
        console.error("No node data available from Proxmox API");
      }
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error(
        "Node stats request failed: " + textStatus + ", " + errorThrown
      );
    });

  // Fetch LVM Disk Stats
  $.ajax({
    url: `${PROXMOX_BASE_URL}/nodes/mini-pc/disks/lvm`, // Centralized URL
    method: "GET",
    timeout: 0,
    headers: AUTH_HEADERS,
  })
    .done(function (response) {
      if (response.data && response.data.children) {
        // Process each LVM group (e.g., "TB", "pve")
        let diskHtml = response.data.children
          .map((group) => {
            var totalGB = (group.size / (1024 * 1024 * 1024)).toFixed(2);
            var freeGB = (group.free / (1024 * 1024 * 1024)).toFixed(2);
            var usedGB = (totalGB - freeGB).toFixed(2);
            var percentUsed = ((usedGB / totalGB) * 100).toFixed(2);

            return `
              <div class="disk-group mb-2">
                <p class="mb-1 text-white">${
                  group.name
                }: ${usedGB} / ${totalGB} GB</p>
                <div class="progress">
                  <div
                    class="progress-bar"
                    role="progressbar"
                    style="width: ${percentUsed}%"
                    aria-valuenow="${percentUsed}"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    class="${
                      percentUsed > 80
                        ? "bg-danger"
                        : percentUsed > 50
                        ? "bg-warning"
                        : "bg-success"
                    }"
                  ></div>
                </div>
              </div>
            `;
          })
          .join("");

        $("#disk-usage").html(diskHtml);
      } else {
        $("#disk-usage").html("<p>No disk data available</p>");
      }
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      console.error(
        "LVM disk request failed: " + textStatus + ", " + errorThrown
      );
      $("#disk-usage").html("<p>Error loading disk data</p>");
    });

  // Fetch LXC container stats
  $.ajax({
    url: `${PROXMOX_BASE_URL}/nodes/mini-pc/lxc`, // Centralized URL
    method: "GET",
    timeout: 0,
    headers: AUTH_HEADERS,
  })
    .done(function (response) {
      if (response.data && response.data.length >= 0) {
        var totalLXC = response.data.length;
        var runningLXC = response.data.filter(
          (container) => container.status === "running"
        ).length;
        $("#lxc-total").text(totalLXC);
        $("#lxc-running")
          .text(runningLXC)
          .removeClass("text-danger text-warning text-success")
          .addClass(
            runningLXC === totalLXC && totalLXC > 0
              ? "text-success"
              : runningLXC > 0
              ? "text-warning"
              : "text-danger"
          );
      } else {
        $("#lxc-total").text("0");
        $("#lxc-running")
          .text("0")
          .removeClass("text-success text-warning")
          .addClass("text-danger");
        console.error("No LXC data available from Proxmox API");
      }
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      $("#lxc-total").text("Error").addClass("text-danger");
      $("#lxc-running").text("Error").addClass("text-danger");
      console.error("LXC request failed: " + textStatus + ", " + errorThrown);
    });

  // Fetch QEMU VM stats
  $.ajax({
    url: `${PROXMOX_BASE_URL}/nodes/mini-pc/qemu`, // Centralized URL
    method: "GET",
    timeout: 0,
    headers: AUTH_HEADERS,
  })
    .done(function (response) {
      if (response.data && response.data.length >= 0) {
        var totalVMs = response.data.length;
        var runningVMs = response.data.filter(
          (vm) => vm.status === "running"
        ).length;
        $("#vms-total").text(totalVMs);
        $("#vms-running")
          .text(runningVMs)
          .removeClass("text-danger text-warning text-success")
          .addClass(
            runningVMs === totalVMs && totalVMs > 0
              ? "text-success"
              : runningVMs > 0
              ? "text-warning"
              : "text-danger"
          );
      } else {
        $("#vms-total").text("0");
        $("#vms-running")
          .text("0")
          .removeClass("text-success text-warning")
          .addClass("text-danger");
        console.error("No VM data available from Proxmox API");
      }
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      $("#vms-total").text("Error").addClass("text-danger");
      $("#vms-running").text("Error").addClass("text-danger");
      console.error("VM request failed: " + textStatus + ", " + errorThrown);
    });

  // Re-render Feather icons after DOM updates
  feather.replace();
}

// Call the update function when the page loads
$(document).ready(function () {
  updateProxmoxStats();
  setInterval(updateProxmoxStats, 2000);
});
