'use strict';

/**
 * Return all open jobs for a given department
 * @param apiToken string.
 * @param departmentId string.
 */
let getJobsForDepartment = (() => {
  var _ref = _asyncToGenerator(function* (apiToken, departmentId) {
    return axios.get('https://harvest.greenhouse.io/v1/jobs', {
      params: {
        department_id: departmentId,
        status: 'open'
      },
      auth: {
        username: apiToken,
        password: ''
      }
    });
  });

  return function getJobsForDepartment(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

/**
 * Return all job posts
 * @param apiToken string.
 * @param queryParams object, defaults to only live job posts
 */


let getJobPosts = (() => {
  var _ref2 = _asyncToGenerator(function* (apiToken, queryParams) {
    return axios.get('https://harvest.greenhouse.io/v1/job_posts', {
      params: queryParams,
      auth: {
        username: apiToken,
        password: ''
      }
    });
  });

  return function getJobPosts(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
})();

/**
 * Gets all departments for a given organization
 * @param apiToken string.
 */


let getDepartments = (() => {
  var _ref3 = _asyncToGenerator(function* (apiToken) {
    return axios.get('https://harvest.greenhouse.io/v1/departments', {
      auth: {
        username: apiToken,
        password: ''
      }
    });
  });

  return function getDepartments(_x5) {
    return _ref3.apply(this, arguments);
  };
})();

/**
 * Gatsby requires ID to be a string to define nodes and greenhouse.io uses an integer instead.
 *
 * @param obj object.
 * @returns object.
 */


var _nodes = require('./nodes');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const crypto = require('crypto');
const axios = require('axios');
const changeId = obj => {
  const updatedObj = obj;
  updatedObj.id = updatedObj.id.toString();
  return updatedObj;
};

const defaultPluginOptions = {
  jobPosts: {
    live: true
  }
};

exports.sourceNodes = (() => {
  var _ref4 = _asyncToGenerator(function* ({ actions }, { apiToken, pluginOptions }) {
    const createNode = actions.createNode;

    const options = pluginOptions || defaultPluginOptions;

    console.log(`Fetch Greenhouse data`);

    console.log(`Starting to fetch data from Greenhouse`);

    let departments, jobPosts, jobsTest;
    try {
      departments = yield getDepartments(apiToken).then(function (response) {
        return response.data;
      });
      jobPosts = yield getJobPosts(apiToken, options.jobPosts).then(function (response) {
        return response.data;
      });
      jobsTest = yield getJobsForDepartment(apiToken).then(function (response) {
        return response.data;
      })
    } catch (e) {
      console.log(`Failed to fetch data from Greenhouse`);
      process.exit(1);
    }

    console.log(`jobPosts fetched`, jobPosts.length);
    console.log(`departments fetched`, departments.length);

    return Promise.all(departments.map((() => {
      var _ref5 = _asyncToGenerator(function* (department) {
        const convertedDepartment = changeId(department);

        let jobs;
        try {
          const jobsForDepartmentResults = yield getJobsForDepartment(apiToken, convertedDepartment.id);
          jobs = jobsForDepartmentResults.data.map(function (job) {
            return changeId(job);
          });
        } catch (e) {
          console.log(`Failed to fetch jobs for department.`);
          process.exit(1);
        }

        var jobPostsMapping = jobPosts.reduce(function (map, jobPost) {
          map[jobPost.job_id] = jobPost;
          return map;
        }, {});


        var jobPostsForDepartment = jobs.reduce(function (arr, job) {
          const mappedJobPost = jobPostsMapping[job.id];
          if (mappedJobPost) {
            mappedJobPost.custom_fields = job.keyed_custom_fields;
            mappedJobPost.offices = job.offices;
            arr.push(mappedJobPost);
          }
          return arr;
        }, []);

        convertedDepartment.jobPosts = jobPostsForDepartment;
        const departmentNode = (0, _nodes.DepartmentNode)(changeId(convertedDepartment));

        jobPostsForDepartment.forEach(function (jobPost) {
          const convertedJobPost = changeId(jobPost);
          const jobPostNode = (0, _nodes.JobPostNode)(convertedJobPost, {
            parent: departmentNode.id
          });
          createNode(jobPostNode);
        });

        createNode(departmentNode);
      });

      return function (_x8) {
        return _ref5.apply(this, arguments);
      };
    })()));
  });

  return function (_x6, _x7) {
    return _ref4.apply(this, arguments);
  };
})();