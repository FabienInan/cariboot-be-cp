require('dotenv').config();

const { Router } = require('express');

const axios = require('axios');

const { PRIVATE_GITLAB_TOKEN } = process.env;

const repoFileUrl = (projectId, filePath, branch) => `https://gitlab.com/api/v4/projects/${projectId}/repository/files/${filePath}?ref=${branch}&private_token=${PRIVATE_GITLAB_TOKEN}`;

const repoCommitUrl = (projectId) => `https://gitlab.com/api/v4/projects/${projectId}/repository/commits`;

const repoNewBranchUrl = (projectId, branch, ref) => `https://gitlab.com/api/v4/projects/${projectId}/repository/branches?branch=${branch}&ref=${ref}`;

const pipelineUrl = (projectId) => `https://gitlab.com/api/v4/projects/${projectId}/trigger/pipeline`;

const router = Router();

router.post('/branchForCommit', async (req, res) => {
  try {
    const result = await axios.get(
      `https://gitlab.com/api/v4/projects/${req?.body?.projectId}/repository/commits/${req?.body?.commit}`,
      {
        headers: {
          'PRIVATE-TOKEN': PRIVATE_GITLAB_TOKEN,
        },
      },
    );
    res.status(200).send({ branch: result?.data?.last_pipeline?.ref });
  } catch (e) {
    res.status(400).send();
  }
});

router.put('/updateFile', (req, res) => {
  const body = {
    ...req?.body,
    commit_message: 'Update file by Cariboot',
  };
  axios.put(
    repoFileUrl(req.body.projectId, req.body.filePath, req.body.branch),
    body,
  ).then(() => {
    res.status(200).send();
  }).catch(
    () => {
      res.status(400).send();
    },
  );
});

router.post('/updateFiles', (req, res) => {
  const body = {
    ...req?.body,
    commit_message: 'Update files by Cariboot',
  };
  axios.post(
    repoCommitUrl(req.body.projectId),
    body,
    {
      headers: {
        'PRIVATE-TOKEN': PRIVATE_GITLAB_TOKEN,
      },
    },
  ).then(() => {
    res.status(200).send();
  }).catch(
    () => {
      res.status(400).send();
    },
  );
});

router.post('/createBranch', (req, res) => {
  axios.post(
    repoNewBranchUrl(req.body.projectId, req.body.branch, req.body.ref),
    {},
    {
      headers: {
        'PRIVATE-TOKEN': PRIVATE_GITLAB_TOKEN,
      },
    },
  ).then(() => {
    res.status(200).send();
  }).catch(
    () => {
      res.status(400).send();
    },
  );
});

router.post('/triggerJob', (req, res) => {
  axios.post(
    pipelineUrl(req.body.projectId),
    req?.body,
    {
      headers: {
        'PRIVATE-TOKEN': PRIVATE_GITLAB_TOKEN,
      },
    },
  ).then(() => {
    res.status(200).send();
  }).catch(
    (e) => {
      res.status(400).send();
    },
  );
});

module.exports = router;
