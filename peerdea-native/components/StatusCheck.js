import {DOCKER_URL} from "@env"

export default async function statusCheck() {
  try {
    console.log("dockerURL is " + DOCKER_URL);
    var statusRes = await fetch(`http://${DOCKER_URL}/api/status`, {
      method: "GET",
    });
    let statusResJson = await statusRes.json();
    //console.log("status is " + statusResJson.status);
    return statusResJson.status;
  } catch (e) {
    //console.log("error is " + statusResJson.status);
    return "down";
  }
}
