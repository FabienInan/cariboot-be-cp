require('dotenv').config();

const { Router } = require('express');

const axios = require('axios');

const { PRIVATE_SCALINGO_TOKEN } = process.env;

const router = Router();

const getExchangeToken = async () => {
  const token = Buffer.from(`:${PRIVATE_SCALINGO_TOKEN}`, 'utf8').toString('base64');
  const res = await axios.post('https://auth.scalingo.com/v1/tokens/exchange', {}, {
    headers: {
      Authorization: `Basic :${token}`,
    },
  });
  return res?.data?.token;
};

const getScmIntegrationLink = async (scalingoAppName, bearerToken) => {
  const res = await axios.get(`https://api.osc-fr1.scalingo.com/v1/apps/${scalingoAppName}/scm_repo_link`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });
  return res?.data?.scm_repo_link?.app_id;
};

router.post('/triggerDeployment', async (req, res) => {
  try {
    const scalingoAppName = `${req?.body?.appName}-${req?.body?.environment}-${req?.body?.archi}`;
    const bearerToken = await getExchangeToken();
    const scmIntegrationLink = await getScmIntegrationLink(scalingoAppName, bearerToken);
    await axios.post(`https://api.osc-fr1.scalingo.com/v1/apps/${scmIntegrationLink}/scm_repo_link/manual_deploy`, {
      branch: req?.body?.branch,
    }, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });
    res.status(200).send();
  } catch (e) {
    res.status(400).send();
  }
});

router.post('/lastDeployments', async (req, res) => {
  try {
    const scalingoAppName = `${req?.body?.appName}-${req?.body?.environment}-${req?.body?.archi}`;
    const bearerToken = await getExchangeToken();
    const result = await axios.get(`https://api.osc-fr1.scalingo.com/v1/apps/${scalingoAppName}/deployments`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    });
    res.status(200).send(result?.data?.deployments);
  } catch (e) {
    res.status(400).send();
  }
});

module.exports = router;
