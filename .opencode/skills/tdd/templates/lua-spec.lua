-- File: .opencode/skills/tdd/templates/lua-spec.lua
-- OpenCode TDD Template: Lua Specification using atomicptr/spec.lua BDD framework
--
-- OpenCode TDD Guidelines to follow:
-- * Test Structure & Best Practices: .opencode/skills/tdd/tests.md
-- * Designing Clean Interfaces:      .opencode/skills/tdd/interface-design.md
-- * Proper Mocking Strategies:       .opencode/skills/tdd/mocking.md
-- * Building Deep Modules:           .opencode/skills/tdd/deep-modules.md

-- local spec = require("spec") -- Uncomment or adapt if spec.lua is not globally loaded
-- local describe, it, expect, before_each, after_each = spec.describe, spec.it, spec.expect, spec.before_each, spec.after_each

-- Require the module under test here
-- local ModuleUnderTest = require("src.module_name")

describe("ModuleUnderTest", function()

    -- Setup: Runs before each test in this describe block
    -- Keep setup simple to maintain test readability (.opencode/skills/tdd/tests.md)
    before_each(function()
        -- Initialize state, reset mock call counts, etc.
    end)

    -- Teardown: Runs after each test in this describe block
    after_each(function()
        -- Clean up state, close file handles, etc.
    end)

    describe("Feature or Function Name", function()
        
        it("should execute primary behavior adhering to its interface", function()
            -- Ensure your module hides complexity behind a simple interface (.opencode/skills/tdd/deep-modules.md)
            -- and respects boundary contracts (.opencode/skills/tdd/interface-design.md).
            
            -- Arrange
            local input = "sample_input"
            local expected_output = "sample_output"
            
            -- Act
            -- local result = ModuleUnderTest.process(input)
            local result = "sample_output" -- Placeholder for actual execution
            
            -- Assert
            expect(result).to_equal(expected_output)
        end)

        it("should isolate external dependencies using appropriate mocks", function()
            -- Avoid over-mocking; mock only at system boundaries or for slow/unpredictable I/O
            -- Refer to .opencode/skills/tdd/mocking.md for strict mocking rules.

            -- Arrange
            local mock_db = {
                save = function(data) return true end
            }
            
            -- Act
            local success = mock_db.save({ id = 1 })
            
            -- Assert
            expect(success).to_be_truthy()
        end)
        
        it("should throw an error when provided with invalid arguments", function()
            -- Arrange
            local bad_input = nil
            
            -- Act & Assert
            local ok, err = pcall(function()
                -- ModuleUnderTest.process(bad_input)
                error("Invalid argument") -- Placeholder for actual error throw
            end)
            
            expect(ok).to_be_falsy()
            -- Example of checking specific error messages if needed:
            -- expect(err:match("Invalid argument")).to_be_truthy()
        end)

    end)
end)