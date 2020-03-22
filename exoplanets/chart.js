var d3 = Object.assign({},
  require("d3-selection"),
  require("d3-scale"),
  require("d3-fetch"),
  require("d3-format"),
  require("d3-hierarchy"));

import React from "react";
import {Form, Row, Col} from "react-bootstrap";

var url = "https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?&table=exoplanets&select=pl_hostname,pl_orbsmax,pl_bmassj,pl_radj&where=pl_orbsmax%20is%20not%20null%20and%20pl_bmassj%20is%20not%20null%20and%20pl_radj%20is%20not%20null&format=csv";

export const id = "chart-exoplanets";
export const name = "Exoplanets";
export const readme = "This chart summarizes a few key properties of confirmed exoplanets in the NASA exoplanet archive.";
export const sources = [
  {url: "https://exoplanetarchive.ipac.caltech.edu/", description: "NASA Exoplanet Archive"},
  {url: "http://xkcd.com/1071/", description: "xkcd 1071"},
  {url: "http://bl.ocks.org/mbostock/3007180", description: "block #3007180"}];

export function controls() {
  return (
    <Form>
      <Form.Group as={Row}>
        <Form.Label column md={2}>
          Sort by:
        </Form.Label>
        <Col md={10} style={{paddingTop: 5}}>      
          <Form.Check inline label="Nothing" className="control-exoplanets-sorting" type="radio" name="sorting" defaultValue="undefined" defaultChecked/>
          <Form.Check inline label="Radius" className="control-exoplanets-sorting" type="radio" name="sorting" defaultValue="radius"/>
          <Form.Check inline label="Mass" className="control-exoplanets-sorting" type="radio" name="sorting" defaultValue="mass"/>
          <Form.Check inline label="Separation" className="control-exoplanets-sorting" type="radio" name="sorting" defaultValue="separation"/>
        </Col>
      </Form.Group>
    </Form>
  );
}

export function create(el, props) {
  var margin = {top: 20, right: 10, bottom: 20, left: 10};
  var width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

  var size = height;

  var svg = d3.select(el)
    .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("text")
    .attr("class", "message")
    .text("Loading data from the NASA Exoplanet Archive ...");

  svg.append("text")
    .attr("class", "name")
    .style("font-weight", "bold")
    .style("font-size", "120%");

  svg.append("text")
    .selectAll("tspan").data(["radius", "mass", "separation"])
  .enter().append("tspan")
    .attr("class", d => `info ${d}`)
    .attr("x", 0)
    .attr("y", (d, i) => `${2 + 1.5*i}em`);

  var pack = d3.pack()
    .size([size, size])
    .padding(5);

  var color = d3.scaleLinear()
    .domain([0, 1.6])
    .range(["#fff", "#1f77b4"])
    .clamp(true);

  function sortBy(prop) {
    if (typeof prop !== "undefined" && prop != "undefined") {
      return (a, b) => a.data[prop] - b.data[prop];
    } else {
      return (a, b) => Math.round(Math.random()) * 2 - 1;
    }
  }

  d3.csv(url, row)
    .then(function(data) {
      svg.select(".message")
        .remove();

      var root = d3.hierarchy({children: data})
        .sum(d => d.radius);

      var nodes = svg.append("g")
        .attr("transform", `translate(${(width-size)/2},${(height-size)/2})`);

      render();
      svg.select(".node").each(focus); // focus on first node

      d3.selectAll(".control-exoplanets-sorting")
        .select("input")
        .on("change", function() {
          root.sort(sortBy(this.value));
          render();
        });

      function render() {
        pack(root);

        var node = nodes.selectAll("circle").data(root.children);

        node.enter().append("circle")
          .attr("class", "node")
          .style("stroke", "black")
          .style("stroke-width", 1)
          .on("click", focus)
          .on("mouseover", focus)
        .merge(node)
          .style("fill", d => color(d.data.rho))
        .transition().duration(750)
          .attr("cx", d => d.x)
          .attr("cy", d => d.y)
          .attr("r", d => d.r);
      }

      function focus(d) {
        svg.selectAll(".node").style("stroke-width", 1);
        d3.select(this).style("stroke-width", 3);
        svg.select(".name").text(d.data.name);
        svg.select(".info.radius").call(subscript,
          `Radius: ${number(d.data.radius, 2)} R`, "Jupiter");
        svg.select(".info.mass").call(subscript,
          `Mass: ${number(d.data.mass, 3)} M`, "Jupiter");
        svg.select(".info.separation").text(
          `Separation: ${number(d.data.separation, 2)} AU`);
      }
    })
  .catch(function() {
    svg.select(".message")
      .text("Failed to load data.");
  });
;

  function number(x, p) {
    return d3.format("." + p + "f")(x);
  }

  function subscript(selection, text, sub) {
    selection.selectAll("tspan").remove();
    selection.append("tspan")
      .text(text);
    selection.append("tspan")
      .attr("baseline-shift", "sub")
      .style("font-size", "60%")
      .text(sub);
  }

  function row(d) {
    var eps = 1e-9;
    d.name = d.pl_hostname;
    d.mass = d.pl_bmassj ? +d.pl_bmassj + eps * Math.random() : Infinity;
    d.radius = d.pl_radj ? +d.pl_radj + eps * Math.random() : Infinity;
    d.separation = d.pl_orbsmax ? +d.pl_orbsmax + eps * Math.random() : Infinity;
    if ([d.radius, d.mass, d.separation].every(isFinite)) {
      d.rho = d.mass/Math.pow(d.radius, 3);
      return d;
    }
  }
}

export function destroy() {}