# 📃 Test report: {name}
#### `Workflow: {workflow} | Run #{runNum}`

<img src="http://svg.test-summary.com/dashboard.svg?p={passed}&f={tFailed}&s={skipped}">

---

|   TOTAL |   PASSED |   FAILED |   SKIPPED |   BROKEN |   ERRORED |
|--------:|---------:|---------:|----------:|---------:|----------:|
| {total} | {passed} | {failed} | {skipped} | {broken} | {errored} |

## 🕑 Timing

|    TOTAL TIME |         LOAD |         SETUP |         ACTIVATE |         RUN |         DISPOSE |
|--------------:|-------------:|--------------:|-----------------:|------------:|----------------:|
| `{totalTime}` | `{loadTime}` | `{setupTime}` | `{activateTime}` | `{runTime}` | `{disposeTime}` |

## ⚠ Failures

{failures}

---

<div><sub>🚀 <code>{event}</code></sub></div>
<sub>Commit <code>{commit}</code> by {author} @ <code>{ref}</code></sub>