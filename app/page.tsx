"use client"

import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import Checkbox from "@mui/material/Checkbox"
import Chip from "@mui/material/Chip"
import Container from "@mui/material/Container"
import FormControlLabel from "@mui/material/FormControlLabel"
import Grid from "@mui/material/Grid"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemText from "@mui/material/ListItemText"
import Stack from "@mui/material/Stack"
import Switch from "@mui/material/Switch"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import React, { useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

function MyStackedBarChart({ resultEstimation, numGPUs }: { resultEstimation: ResultEstimation; numGPUs: number }) {
  let data = []

  for (let i = 0; i < numGPUs; i++) {
    data.push({
      // name: `${i} GPU${i !== 1 ? "s" : ""}`,
      name: i,
      "CUDA Kernels": resultEstimation.cudaKernels,
      Parameters: resultEstimation.parameters.toFixed(3),
      Outputs: resultEstimation.outputs ?? 0,
      activations: resultEstimation.activations ?? 0,
      gradients: resultEstimation.gradients ?? 0,
      firstMoments: resultEstimation.firstMoments ?? 0,
      secondMoments: resultEstimation.secondMoments ?? 0,
    })
  }

  data = data.reverse()

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart layout="vertical" data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" />
        <Tooltip />
        <Legend />
        {resultEstimation.cudaKernels != null && <Bar dataKey="CUDA Kernels" stackId="a" fill="#8884d8" />}
        {resultEstimation.parameters != null && <Bar dataKey="Parameters" stackId="a" fill="#82ca9d" />}
        {resultEstimation.outputs != null && <Bar dataKey="Outputs" stackId="a" fill="#ffc658" />}
        {resultEstimation.activations != null && <Bar dataKey="activations" stackId="a" fill="#ff8042" />}
        {resultEstimation.gradients != null && <Bar dataKey="gradients" stackId="a" fill="#81d4fa" />}
        {resultEstimation.firstMoments != null && <Bar dataKey="firstMoments" stackId="a" fill="#f48fb1" />}
        {resultEstimation.secondMoments != null && <Bar dataKey="secondMoments" stackId="a" fill="#80cbc4" />}
      </BarChart>
    </ResponsiveContainer>
  )
}

enum Optimizer {
  Adam,
  SGD,
}

enum Precision {
  full,
  half,
}

interface ModelConfig {
  precision: Precision
  numParams: number
  hiddenSize: number
  vocabSize: number
  numAttentionHeads: number
  numKeyValueHeads: number
  intermediateSize: number
}

interface RunConfig {
  isTraining: boolean
  optimizer: Optimizer
  optimizerSGDMomentum: boolean
  sequenceLength: number
  batchSize: number
  numGPUs: number
  isFSDP: boolean
}

interface ResultEstimation {
  cudaKernels: number
  parameters: number
  outputs?: number
  activations?: number
  gradients?: number
  firstMoments?: number
  secondMoments?: number
}

const defaultRunConfig: RunConfig = {
  isTraining: false,
  optimizer: Optimizer.Adam,
  optimizerSGDMomentum: false,
  sequenceLength: 1024,
  batchSize: 8,
  numGPUs: 1,
  isFSDP: false,
}

const modelConfigPresets: {
  label: string
  modelConfig: ModelConfig
}[] = [
  {
    label: "NousResearch/Llama-2-7b-hf",
    modelConfig: {
      precision: Precision.half,
      numParams: 6.738,
      hiddenSize: 4096,
      vocabSize: 32000,
      numAttentionHeads: 32,
      numKeyValueHeads: 32,
      intermediateSize: 11008,
    },
  },
  {
    label: "mistralai/Mistral-7B-v0.1",
    modelConfig: {
      precision: Precision.half,
      numParams: 6.738,
      hiddenSize: 4096,
      vocabSize: 32000,
      numAttentionHeads: 32,
      numKeyValueHeads: 8,
      intermediateSize: 14336,
    },
  },
  {
    label: "gpt2-xl",
    modelConfig: {
      precision: Precision.full,
      numParams: 1.555,
      hiddenSize: 1024,
      vocabSize: 50257,
      numAttentionHeads: 25,
      numKeyValueHeads: 25,
      intermediateSize: 4 * 1024,
    },
  },
]

function estimateResult({
  modelConfig,
  runConfig,
}: {
  modelConfig: ModelConfig
  runConfig: RunConfig
}): ResultEstimation {
  const bytesPerParam = modelConfig.precision == Precision.full ? 4 : 2
  const resultEsimation: ResultEstimation = {
    cudaKernels: 0.341,
    parameters: (bytesPerParam * modelConfig.numParams * 10 ** 9) / 2 ** 30,
    outputs: (4 * runConfig.batchSize * runConfig.sequenceLength * modelConfig.vocabSize) / 2 ** 30,
  }
  console.log(resultEsimation)
  console.log(modelConfig.vocabSize)
  return resultEsimation
}

export default function App() {
  const [modelConfigPreset, setModelConfigPreset] = useState(modelConfigPresets[0])
  const [modelConfig, setModelConfig] = useState(modelConfigPresets[0].modelConfig)
  const [runConfig, setRunConfig] = useState(defaultRunConfig)

  const resultEstimation = estimateResult({ modelConfig, runConfig })

  return (
    <Container maxWidth="md">
      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12}>
          <Typography variant="h4" align="center" sx={{ fontWeight: "bold" }}>
            VRAM Estimator
          </Typography>
          <Typography variant="subtitle1" align="center">
            Estimate GPU VRAM usage based on params
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Stack spacing={2} justifyItems="center">
            <Typography variant="h5" align="center" sx={{ fontWeight: "bold" }}>
              Running Parameters
            </Typography>

            <Stack spacing={1} direction="row" justifyContent="center">
              <Chip
                label="Inference"
                color="primary"
                variant={runConfig.isTraining ? "outlined" : "filled"}
                onClick={() => setRunConfig({ ...runConfig, isTraining: false })}
              />
              <Chip
                label="Training"
                color="primary"
                variant={runConfig.isTraining ? "filled" : "outlined"}
                onClick={() => setRunConfig({ ...runConfig, isTraining: true })}
              />
            </Stack>

            {runConfig.isTraining && (
              <Stack spacing={1} direction="row" justifyContent="center">
                <Chip
                  label="Adam"
                  color="primary"
                  variant={runConfig.optimizer === Optimizer.Adam ? "filled" : "outlined"}
                  onClick={() => setRunConfig({ ...runConfig, optimizer: Optimizer.Adam })}
                />
                <Chip
                  label="SGD"
                  color="primary"
                  variant={runConfig.optimizer === Optimizer.SGD ? "filled" : "outlined"}
                  onClick={() => setRunConfig({ ...runConfig, optimizer: Optimizer.SGD })}
                />
              </Stack>
            )}

            {runConfig.isTraining && runConfig.optimizer == Optimizer.SGD && (
              <Box display="flex" justifyContent="center">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={runConfig.optimizerSGDMomentum}
                      onChange={(e) => setRunConfig({ ...runConfig, optimizerSGDMomentum: e.target.checked })}
                    />
                  }
                  label="momentum"
                />
              </Box>
            )}

            <TextField
              label="Sequence Length"
              value={runConfig.sequenceLength > 0 ? runConfig.sequenceLength : ""}
              error={runConfig.sequenceLength === 0}
              onChange={(e) =>
                Number(e.target.value) >= 0
                  ? setRunConfig({ ...runConfig, sequenceLength: Number(e.target.value) })
                  : runConfig.sequenceLength
              }
              helperText={runConfig.sequenceLength === 0 ? "Can't be empty!" : ""}
            />

            <TextField
              label={runConfig.numGPUs > 1 ? "Per GPU Batch Size" : "Batch Size"}
              value={runConfig.batchSize > 0 ? runConfig.batchSize : ""}
              error={runConfig.batchSize === 0}
              onChange={(e) =>
                Number(e.target.value) >= 0
                  ? setRunConfig({ ...runConfig, batchSize: Number(e.target.value) })
                  : runConfig.batchSize
              }
              helperText={runConfig.batchSize === 0 ? "Can't be empty!" : ""}
            />

            <TextField
              label="Number of GPUs"
              value={runConfig.numGPUs > 0 ? runConfig.numGPUs : ""}
              error={runConfig.numGPUs === 0}
              onChange={(e) =>
                Number(e.target.value) >= 0
                  ? setRunConfig({ ...runConfig, numGPUs: Number(e.target.value) })
                  : runConfig.numGPUs
              }
              helperText={runConfig.numGPUs === 0 ? "Can't be empty!" : ""}
            />

            {runConfig.isTraining && (
              <FormControlLabel
                control={
                  <Switch
                    checked={runConfig.isFSDP}
                    onClick={() => setRunConfig({ ...runConfig, isFSDP: !runConfig.isFSDP })}
                  />
                }
                label="FSDP parallelization"
              />
            )}

            <Typography variant="h5" align="center" sx={{ fontWeight: "bold" }}>
              Model Parameters
            </Typography>

            <Autocomplete
              options={modelConfigPresets}
              renderInput={(params) => <TextField {...params} label="Parameters Preset" />}
              value={modelConfigPreset.modelConfig == modelConfig ? modelConfigPreset : null}
              onChange={(event, newValue) => {
                if (newValue) {
                  setModelConfigPreset(newValue)
                  setModelConfig(newValue.modelConfig)
                }
              }}
            />

            <Stack spacing={1} direction="row" justifyContent="center">
              <Chip
                label="fp16/bf16"
                color="primary"
                variant={modelConfig.precision == Precision.half ? "filled" : "outlined"}
                onClick={() => setModelConfig({ ...modelConfig, precision: Precision.half })}
              />
              <Chip
                label="fp32"
                color="primary"
                variant={modelConfig.precision == Precision.full ? "filled" : "outlined"}
                onClick={() => setModelConfig({ ...modelConfig, precision: Precision.full })}
              />
            </Stack>

            <TextField
              label="Number of Parameters (billions)"
              value={modelConfig.numParams > 0 ? modelConfig.numParams : ""}
              error={modelConfig.numParams === 0}
              onChange={(e) =>
                Number(e.target.value) >= 0
                  ? setModelConfig({ ...modelConfig, numParams: Number(e.target.value) })
                  : modelConfig.numParams
              }
              helperText={modelConfig.numParams === 0 ? "Can't be empty!" : ""}
            />

            <TextField
              label="Hidden Size"
              value={modelConfig.hiddenSize > 0 ? modelConfig.hiddenSize : ""}
              error={modelConfig.hiddenSize === 0}
              onChange={(e) =>
                Number(e.target.value) >= 0
                  ? setModelConfig({ ...modelConfig, hiddenSize: Number(e.target.value) })
                  : modelConfig.hiddenSize
              }
              helperText={modelConfig.hiddenSize === 0 ? "Can't be empty!" : ""}
            />

            <TextField
              label="Vocab Size"
              value={modelConfig.vocabSize > 0 ? modelConfig.vocabSize : ""}
              error={modelConfig.vocabSize === 0}
              onChange={(e) =>
                Number(e.target.value) >= 0
                  ? setModelConfig({ ...modelConfig, vocabSize: Number(e.target.value) })
                  : modelConfig.vocabSize
              }
              helperText={modelConfig.vocabSize === 0 ? "Can't be empty!" : ""}
            />

            <TextField
              label="Number of Key Value Heads"
              value={modelConfig.numKeyValueHeads > 0 ? modelConfig.numKeyValueHeads : ""}
              error={modelConfig.numKeyValueHeads === 0}
              onChange={(e) =>
                Number(e.target.value) >= 0
                  ? setModelConfig({ ...modelConfig, numKeyValueHeads: Number(e.target.value) })
                  : modelConfig.numKeyValueHeads
              }
              helperText={
                modelConfig.numKeyValueHeads === 0
                  ? "Can't be empty!"
                  : "Might be different from number of attention heads when using Grouped Query Attention"
              }
            />
          </Stack>
        </Grid>
        <Grid item alignItems="center" xs={12} sm={6}>
          <Stack spacing={2} justifyItems="center">
            <Typography variant="h5" align="center" sx={{ fontWeight: "bold" }}>
              Estimation Result
            </Typography>

            <MyStackedBarChart resultEstimation={resultEstimation} numGPUs={runConfig.numGPUs} />
            <List dense={true}>
              <ListItem>
                <ListItemText
                  primary={"Model parameters use " + resultEstimation.parameters.toFixed(3) + " GiB of VRAM"}
                  secondary={
                    "Number of parameters (" +
                    modelConfig.numParams +
                    " billion) * number of bytes per parameter (" +
                    (modelConfig.precision == Precision.full ? 4 : 2) +
                    " bytes in case of " +
                    (modelConfig.precision == Precision.full ? "full" : "half") +
                    " precision)"
                  }
                />
              </ListItem>
            </List>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  )
}
